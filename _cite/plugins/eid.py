"""
Plugin to handle Scopus EIDs by extracting complete citation data from the Scopus API
"""

import os
import re
import json
import requests
from urllib.parse import quote
from datetime import datetime
from util import log, get_safe, cache

def extract_id_from_eid(eid):
    """Extract the numeric portion from a Scopus EID"""
    if not eid:
        return None
    
    match = re.search(r'2-s2\.0-(\d+)', eid)
    if match:
        return match.group(1)
    return None

def get_citation_from_scopus(eid_value):
    """
    Get complete citation data from Scopus API
    Requires SCOPUS_API_KEY environment variable
    
    Args:
        eid_value (str): Scopus EID in format 'eid:2-s2.0-XXXXXXXXXX'
        
    Returns:
        dict: Complete citation data or None if retrieval failed
    """
    api_key = os.environ.get("SCOPUS_API_KEY")
    if not api_key:
        log("No SCOPUS_API_KEY environment variable found", level="WARNING")
        return None
    
    scopus_id = extract_id_from_eid(eid_value)
    if not scopus_id:
        log(f"Could not extract Scopus ID from {eid_value}", level="WARNING")
        return None
    
    # Cache the API request to avoid repeated calls
    @cache.memoize(name="scopus_citation", expire=30 * (60 * 60 * 24))
    def query_scopus(eid):
        headers = {
            "X-ELS-APIKey": api_key,
            "Accept": "application/json"
        }
        
        url = f"https://api.elsevier.com/content/abstract/scopus_id/{eid}"
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                log(f"Scopus API returned status code {response.status_code}", level="WARNING")
                return None
        except Exception as e:
            log(f"Error querying Scopus API: {e}", level="WARNING")
            return None
    
    # Query Scopus API
    data = query_scopus(scopus_id)
    if not data:
        return None
    
    # Create citation data from Scopus response
    try:
        coredata = get_safe(data, "abstracts-retrieval-response.coredata", {})
        
        # Extract title
        title = get_safe(coredata, "dc:title", "")
        
        # Extract DOI
        doi = get_safe(coredata, "prism:doi", "")
        
        # Extract authors
        authors = []
        authors_data = get_safe(data, "abstracts-retrieval-response.authors.author", [])
        if not isinstance(authors_data, list):
            authors_data = [authors_data]  # Handle single author case
            
        for author in authors_data:
            given_name = get_safe(author, "preferred-name.given-name", "")
            surname = get_safe(author, "preferred-name.surname", "")
            if given_name and surname:
                authors.append(f"{given_name} {surname}")
            elif surname:
                authors.append(surname)
        
        # Extract publisher/journal
        publisher = get_safe(coredata, "prism:publicationName", "")
        
        # Extract date
        date = ""
        cover_date = get_safe(coredata, "prism:coverDate", "")
        if cover_date:
            try:
                # Convert to consistent date format
                parsed_date = datetime.strptime(cover_date, "%Y-%m-%d")
                date = parsed_date.strftime("%Y-%m-%d")
            except:
                # If date parsing fails, use as-is
                date = cover_date
        
        # Extract URL
        link = get_safe(coredata, "prism:url", "")
        if not link and doi:
            link = f"https://doi.org/{doi}"
        
        # Create citation
        citation = {
            "id": f"doi:{doi}" if doi else eid_value,
            "original_id": eid_value,  # Keep original EID for reference
            "title": title,
            "authors": authors,
            "publisher": publisher,
            "date": date,
            "link": link
        }
        
        return citation
        
    except Exception as e:
        log(f"Error parsing Scopus API response: {e}", level="WARNING")
        return None

def create_fallback_citation(eid_value):
    """
    Create a fallback citation object when API retrieval fails
    """
    return {
        "id": eid_value,
        "title": "[Scopus Entry - Please Replace With Manual Citation]",
        "authors": ["Please Update Manually"],
        "publisher": "Unknown - Scopus EID Reference",
        "date": "",
        "link": f"https://www.scopus.com/record/display.uri?eid={quote(eid_value.replace('eid:', ''))}"
    }

def main(entry):
    """
    Process a Scopus EID entry
    Extracts complete citation data from Scopus API
    
    Args:
        entry (dict): Entry with an 'id' field starting with 'eid:'
        
    Returns:
        list: List containing one source dictionary
    """
    # Source id
    _id = get_safe(entry, "id", "").strip()
    
    if not _id.startswith("eid:"):
        raise Exception('ID must start with "eid:"')
    
    # Check if we have manual entry data already
    if entry.get("title") and entry.get("authors") and entry.get("publisher"):
        log(f"Using manual entry data for {_id}", 1)
        return [entry]
    
    # Try to get citation data from Scopus API
    citation = get_citation_from_scopus(_id)
    
    # If successful, use the citation data
    if citation and citation.get("title"):
        log(f"Successfully retrieved citation data for {_id}", 1, "SUCCESS")
        log(f"Title: {citation.get('title')}", 2)
        log(f"Authors: {', '.join(citation.get('authors', []))}", 2)
        log(f"Publisher: {citation.get('publisher')}", 2)
        log(f"Date: {citation.get('date')}", 2)
        
        # Merge with any additional fields from the original entry
        entry_copy = entry.copy()
        entry_copy.update(citation)
        return [entry_copy]
    
    # If citation retrieval failed, create a fallback citation
    log(f"Could not retrieve citation data for {_id}, creating fallback citation", 1, "WARNING")
    source = create_fallback_citation(_id)
    source.update(entry)  # Include any additional fields from the original entry
    
    return [source]