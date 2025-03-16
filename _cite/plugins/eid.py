"""
Enhanced Scopus EID plugin with better author extraction and bypasses cache for manually flagged entries
Place this file at _cite/plugins/eid.py to replace the existing one
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

def query_scopus_direct(eid, api_key):
    """
    Query Scopus API directly without caching
    """
    headers = {
        "X-ELS-APIKey": api_key,
        "Accept": "application/json"
    }
    
    url = f"https://api.elsevier.com/content/abstract/scopus_id/{eid}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        log(f"HTTP error occurred: {http_err}", level="WARNING")
        return None
    except requests.exceptions.ConnectionError as conn_err:
        log(f"Connection error occurred: {conn_err}", level="WARNING")
        return None
    except requests.exceptions.Timeout as timeout_err:
        log(f"Timeout error occurred: {timeout_err}", level="WARNING")
        return None
    except requests.exceptions.RequestException as req_err:
        log(f"Request error occurred: {req_err}", level="WARNING")
        return None
    except Exception as e:
        log(f"Error querying Scopus API: {e}", level="WARNING")
        return None

def get_citation_from_scopus(eid_value, force_refresh=False):
    """
    Get complete citation data from Scopus API with improved author extraction
    Requires SCOPUS_API_KEY environment variable
    
    Args:
        eid_value (str): Scopus EID in format 'eid:2-s2.0-XXXXXXXXXX'
        force_refresh (bool): Whether to bypass the cache and query directly
        
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
    
    # Get data either from cache or direct API call
    if force_refresh:
        log(f"Forcing refresh for {eid_value}, bypassing cache", level="INFO")
        data = query_scopus_direct(scopus_id, api_key)
    else:
        # Cache the API request to avoid repeated calls
        @cache.memoize(name="scopus_citation", expire=30 * (60 * 60 * 24))
        def query_scopus(eid):
            return query_scopus_direct(eid, api_key)
        
        data = query_scopus(scopus_id)
    
    if not data:
        log(f"Failed to retrieve data from Scopus API for ID: {eid_value}", level="WARNING")
        return None
    
    # Create citation data from Scopus response
    try:
        # Check if we have the abstract retrieval response
        if 'abstracts-retrieval-response' not in data:
            log(f"Unexpected API response format for ID: {eid_value}", level="WARNING")
            return None
            
        coredata = get_safe(data, "abstracts-retrieval-response.coredata", {})
        
        # Extract title with better error handling
        title = get_safe(coredata, "dc:title", "")
        if not title:
            log(f"No title found for EID: {eid_value}", level="WARNING")
            title = f"[Untitled Scopus Publication: {eid_value}]"
        
        # Extract DOI
        doi = get_safe(coredata, "prism:doi", "")
        
        # --- Updated Author Extraction Section ---
        authors = []
        authors_data = get_safe(data, "abstracts-retrieval-response.authors.author", [])
        
        # Ensure authors_data is a list (occurs when only one author is present)
        if not isinstance(authors_data, list):
            authors_data = [authors_data]
        
        # Detailed debug info
        log(f"Processing {len(authors_data)} author entries", level="INFO")
        
        for i, author in enumerate(authors_data):
            # First try the preferred-name block
            given_name = get_safe(author, "preferred-name.given-name", "")
            surname = get_safe(author, "preferred-name.surname", "")
            
            # If one or both are missing, try looking directly at the author object
            if not (given_name and surname):
                given_name = author.get("given-name", given_name)
                surname = author.get("surname", surname)
            
            # Finally, if still incomplete, try parsing the indexed-name field
            if not (given_name and surname):
                indexed_name = get_safe(author, "indexed-name", "")
                if indexed_name:
                    parts = indexed_name.split(",", 1)
                    if len(parts) > 1:
                        surname = parts[0].strip()
                        given_name = parts[1].strip()
                    else:
                        surname = indexed_name.strip()
            
            # Build the full name from available parts
            full_name = " ".join(part for part in [given_name, surname] if part).strip()
            if full_name:
                authors.append(full_name)
                log(f"  Author {i+1}: {full_name} (extracted from data)", level="INFO")
            else:
                log(f"  Author {i+1}: Could not extract name", level="WARNING")
                # Try dumping the author object for debugging
                log(f"  Author {i+1} data: {json.dumps(author)[:200]}...", level="INFO")
        
        # Fallback if no authors found: check the dc:creator field
        if not authors:
            creator = get_safe(coredata, "dc:creator", "")
            if creator:
                log(f"Using dc:creator field instead: {creator}", level="INFO")
                for name in re.split(r'[,;]', creator):
                    name = name.strip()
                    if name:
                        authors.append(name)
                        log(f"  Extracted author: {name}", level="INFO")
        
        # Try another approach if still no authors
        if not authors:
            # Look for bibliographic info that might contain authors
            bibrecord = get_safe(data, "abstracts-retrieval-response.item.bibrecord", {})
            head = get_safe(bibrecord, "head", {})
            author_group = get_safe(head, "author-group", [])
            
            if not isinstance(author_group, list):
                author_group = [author_group]
                
            for group in author_group:
                authors_in_group = get_safe(group, "author", [])
                if not isinstance(authors_in_group, list):
                    authors_in_group = [authors_in_group]
                
                for auth in authors_in_group:
                    ce_given_name = get_safe(auth, "ce:given-name", "")
                    ce_surname = get_safe(auth, "ce:surname", "")
                    ce_initials = get_safe(auth, "ce:initials", "")
                    
                    if ce_surname:
                        if ce_given_name:
                            authors.append(f"{ce_given_name} {ce_surname}")
                        elif ce_initials:
                            authors.append(f"{ce_initials} {ce_surname}")
                        else:
                            authors.append(ce_surname)
        
        # If still no authors, add a placeholder and log a warning
        if not authors:
            log(f"No authors found for EID: {eid_value}", level="WARNING")
            authors = ["No Author Information"]
        # --- End Updated Author Extraction Section ---
        
        # Extract publisher/journal with fallbacks
        publisher = get_safe(coredata, "prism:publicationName", "")
        if not publisher:
            publisher = get_safe(coredata, "prism:publisher", "")
        if not publisher:
            source = get_safe(data, "abstracts-retrieval-response.source", {})
            publisher = get_safe(source, "sourcetitle", "")
        if not publisher:
            publisher = "Unknown Publication"
        
        # Extract date with fallbacks and better formatting
        date = ""
        date_fields = ["prism:coverDate", "prism:coverDisplayDate", "prism:publishDate"]
        for field in date_fields:
            date_str = get_safe(coredata, field, "")
            if date_str:
                try:
                    for fmt in ["%Y-%m-%d", "%Y-%m", "%Y"]:
                        try:
                            parsed_date = datetime.strptime(date_str[:len(fmt)], fmt)
                            date = parsed_date.strftime("%Y-%m-%d")
                            break
                        except ValueError:
                            continue
                    if date:
                        break
                except Exception:
                    pass
        if not date:
            date = f"{datetime.now().year}-01-01"
        
        # Extract URL with fallbacks
        link = get_safe(coredata, "prism:url", "")
        if not link and doi:
            link = f"https://doi.org/{doi}"
        if not link:
            link = f"https://www.scopus.com/record/display.uri?eid={eid_value.replace('eid:', '')}"
        
        # Create citation dictionary
        citation = {
            "id": f"doi:{doi}" if doi else eid_value,
            "original_id": eid_value,
            "title": title,
            "authors": authors,
            "publisher": publisher,
            "date": date,
            "link": link
        }
        
        log(f"Successfully extracted citation data for {eid_value}", level="SUCCESS")
        log(f"  Title: {title}", level="INFO")
        log(f"  Authors: {', '.join(authors)}", level="INFO")
        log(f"  Publisher: {publisher}", level="INFO")
        log(f"  Date: {date}", level="INFO")
        
        return citation
        
    except Exception as e:
        log(f"Error parsing Scopus API response: {str(e)}", level="WARNING")
        log(f"Raw API response: {json.dumps(data)[:500]}...", level="INFO")
        return None

def main(entry):
    """
    Process a Scopus EID entry.
    Extracts complete citation data from Scopus API.
    
    Args:
        entry (dict): Entry with an 'id' field starting with 'eid:'
        
    Returns:
        list: List containing one source dictionary
    """
    _id = get_safe(entry, "id", "").strip()
    
    if not _id.startswith("eid:"):
        raise Exception('ID must start with "eid:"')
    
    # Check if manual entry data is complete
    if entry.get("title") and entry.get("authors") and entry.get("publisher") and entry.get("authors") != ["Please Update Manually"]:
        log(f"Using existing complete entry data for {_id}", 1)
        return [entry]
    
    # Check if this is a problematic entry that needs cache bypass
    force_refresh = False
    if entry.get("authors") == ["Please Update Manually"]:
        log(f"Entry {_id} has placeholder authors, forcing API refresh", 1, "INFO")
        force_refresh = True
    
    # Get citation data
    citation = get_citation_from_scopus(_id, force_refresh=force_refresh)
    
    if citation and citation.get("title") and citation.get("authors"):
        log(f"Successfully retrieved citation data for {_id}", 1, "SUCCESS")
        
        entry_copy = entry.copy()
        for key, value in citation.items():
            if key not in entry_copy or (key == "authors" and entry_copy.get(key) == ["Please Update Manually"]):
                entry_copy[key] = value
        return [entry_copy]
    
    log(f"Could not retrieve complete citation data for {_id}, creating improved fallback", 1, "WARNING")
    
    fallback = {
        "id": _id,
        "title": entry.get("title") or f"[Need Title - Scopus ID: {_id}]",
        "authors": entry.get("authors") or ["Please Update Manually"],
        "publisher": entry.get("publisher") or "Unknown - Scopus Publication",
        "date": entry.get("date") or datetime.now().strftime("%Y-01-01"),
        "link": entry.get("link") or f"https://www.scopus.com/record/display.uri?eid={_id.replace('eid:', '')}"
    }
    
    result = entry.copy()
    result.update(fallback)
    
    return [result]