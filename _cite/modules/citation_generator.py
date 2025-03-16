"""
Module for generating citations from sources with file logging and improved error handling
"""

from util import log, get_safe, cite_with_manubot, format_date, label
from modules.logging_module import log_to_file

def generate_citations(sources):
    """
    Generate citation data from sources
    
    Args:
        sources (list): List of source dictionaries
        
    Returns:
        tuple: (citations, all_citations, error_flag)
    """
    # Track if any errors occurred
    error = False
    
    # List of new citations
    citations = []
    
    # Store all original citations for reporting
    all_citations = []
    
    # Loop through compiled sources
    for index, source in enumerate(sources):
        log(f"Processing source {index + 1} of {len(sources)}, {label(source)}")
        log_to_file(f"Processing source {index + 1} of {len(sources)}, {label(source)}")

        # If explicitly flagged, remove/ignore entry
        if get_safe(source, "remove", False) == True:
            continue

        # New citation data for source
        citation = {}

        # Source id
        _id = get_safe(source, "id", "").strip()

        # Handle different ID types appropriately
        if _id.startswith("pyOTFWoAAAAJ:") or _id.startswith("gs-id:"):
            # For Google Scholar citations, we already have all the data we need
            # Just use the source as is
            citation = source
            log(f"Using Google Scholar data for citation: {source.get('title', 'No title')}", 1)
            log_to_file(f"Using Google Scholar data for citation: {source.get('title', 'No title')}", 1)
        elif _id.startswith("eid:"):
            # For Scopus EIDs, check if we already have the citation data
            if source.get("title") and source.get("authors") and source.get("date"):
                # If we have complete citation data, use it directly
                citation = source
                log(f"Using existing data for Scopus EID citation: {source.get('title', 'No title')}", 1)
                log_to_file(f"Using existing data for Scopus EID citation: {source.get('title', 'No title')}", 1)
            else:
                # If data is incomplete, create placeholder to be manually updated
                citation = {
                    "id": _id,
                    "title": f"[Need Manual Citation] - Scopus EID: {_id}",
                    "authors": ["Please Update Manually"],
                    "publisher": "Unknown - Scopus Reference",
                    "date": "2000-01-01",  # Placeholder date
                    "link": f"https://www.scopus.com/record/display.uri?eid={_id.replace('eid:', '')}"
                }
                log(f"Created placeholder for Scopus EID citation: {_id}", 1, level="WARNING")
                log_to_file(f"Created placeholder for Scopus EID citation: {_id}", 1, level="WARNING")
        # Manubot doesn't work without an id for other types
        elif _id:
            log("Using Manubot to generate citation", 1)
            log_to_file("Using Manubot to generate citation", 1)

            try:
                # Run Manubot and set citation
                citation = cite_with_manubot(_id)
                log(f"Manubot generated citation: {citation.get('title', 'No title')}", 2)
                log_to_file(f"Manubot generated citation: {citation.get('title', 'No title')}", 2)

            # If Manubot cannot cite source
            except Exception as e:
                # If regular source (id entered by user), throw error
                if get_safe(source, "plugin", "") == "sources.py":
                    log(e, 3, "ERROR")
                    log_to_file(e, 3, "ERROR")
                    error = True
                # Otherwise, if from metasource (id retrieved from some third-party API), just warn
                else:
                    log(e, 3, "WARNING")
                    log_to_file(e, 3, "WARNING")
                    # Create a placeholder citation instead of discarding
                    citation = {
                        "id": _id,
                        "title": f"[Citation Failed] - ID: {_id}",
                        "authors": ["Please Update Manually"],
                        "publisher": "Unknown - Citation Generation Failed",
                        "date": "2000-01-01"  # Placeholder date
                    }
                    log(f"Created placeholder citation for {_id}", 3, "WARNING")
                    log_to_file(f"Created placeholder citation for {_id}", 3, "WARNING")

        # Preserve fields from input source, overriding existing fields
        citation.update(source)

        # Ensure date in proper format for correct date sorting
        if get_safe(citation, "date", ""):
            citation["date"] = format_date(get_safe(citation, "date", ""))

        # Store original citation for reporting
        all_citations.append(citation.copy())
        
        # Add new citation to list
        citations.append(citation)
    
    return citations, all_citations, error