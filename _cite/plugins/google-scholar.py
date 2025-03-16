import os
import re
from serpapi import GoogleSearch
from util import *

def extract_doi_from_url(url):
    """
    Attempt to extract a DOI from a URL or citation text
    
    Args:
        url (str): URL or text that might contain a DOI
        
    Returns:
        str: Extracted DOI or None
    """
    if not url:
        return None
    
    # Pattern for DOI in URLs (covers most DOI patterns)
    doi_patterns = [
        r'doi\.org/([^/\s&?#]+(?:/[^/\s&?#]+)?)',  # doi.org/10.1234/abc123
        r'doi:([^/\s&?#]+(?:/[^/\s&?#]+)?)',       # doi:10.1234/abc123
        r'([0-9]+\.[0-9]{4,}[0-9]*/[^/\s&?#]+)'    # 10.1234/abc123
    ]
    
    for pattern in doi_patterns:
        match = re.search(pattern, url)
        if match:
            return 'doi:' + match.group(1)
    
    return None

def extract_doi_from_metadata(title, authors, year):
    """
    Create a DOI-like identifier from metadata when actual DOI is unavailable
    
    This is a fallback method that creates a standardized identifier that can help
    with deduplication, even though it's not a real DOI
    
    Args:
        title (str): Publication title
        authors (list): List of author names
        year (str): Publication year
        
    Returns:
        str: Synthetic DOI-like identifier
    """
    if not title or not year:
        return None
    
    # Normalize and create a slug from title
    slug = re.sub(r'[^\w\s]', '', title.lower())
    slug = re.sub(r'\s+', '-', slug)
    slug = slug[:50]  # Limit length
    
    # Get first author's last name if available
    first_author = ''
    if authors and len(authors) > 0:
        parts = authors[0].split()
        if parts:
            first_author = parts[-1].lower()
    
    # Create a synthetic ID that mimics a DOI but is flagged as synthetic
    return f"gs-id:{first_author}.{year}.{slug}"

def main(entry):
    """
    receives single list entry from google-scholar data file
    returns list of sources to cite with enhanced DOI extraction
    """

    # get api key (serp api key to access google scholar)
    api_key = os.environ.get("GOOGLE_SCHOLAR_API_KEY", "")
    if not api_key:
        raise Exception('No "GOOGLE_SCHOLAR_API_KEY" env var')

    # serp api properties
    params = {
        "engine": "google_scholar_author",
        "api_key": api_key,
        "num": 100,  # max allowed
    }

    # get id from entry
    _id = get_safe(entry, "gsid", "")
    if not _id:
        raise Exception('No "gsid" key')

    # query api
    @log_cache
    @cache.memoize(name=__file__, expire=1 * (60 * 60 * 24))
    def query(_id):
        params["author_id"] = _id
        return get_safe(GoogleSearch(params).get_dict(), "articles", [])

    response = query(_id)

    # list of sources to return
    sources = []

    # go through response and format sources
    for work in response:
        # create source with all necessary fields directly in the source
        # this bypasses the need for Manubot to generate citation data
        year = get_safe(work, "year", "")
        title = get_safe(work, "title", "")
        
        # Format authors properly
        author_string = get_safe(work, "authors", "")
        authors = list(map(str.strip, author_string.split(","))) if author_string else []
        
        # Get publication/journal name
        publisher = get_safe(work, "publication", "")
        
        # Create properly formatted date
        date = ""
        if year:
            date = f"{year}-01-01"  # Default to January 1st of the year
        
        # Get link to the paper
        link = get_safe(work, "link", "")
        
        # Try to extract DOI from the link or citation info
        doi = extract_doi_from_url(link)
        
        # If no DOI in link, try the citation info 
        if not doi:
            citation_info = get_safe(work, "citation_id", "")
            doi = extract_doi_from_url(citation_info)
        
        # If still no DOI, create a synthetic identifier for deduplication purposes
        if not doi:
            doi = extract_doi_from_metadata(title, authors, year)
        
        # Create the source object with all required fields
        source = {
            "id": doi if doi else get_safe(work, "citation_id", ""),
            "title": title,
            "authors": authors,
            "publisher": publisher,
            "date": date,
            "link": link,
            "gs_id": get_safe(work, "citation_id", ""),  # Keep original ID as a fallback
        }

        # copy fields from entry to source
        source.update(entry)

        # add source to list
        sources.append(source)

    return sources