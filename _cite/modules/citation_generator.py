"""
Module for generating citations from sources with file logging
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

        # Check if it's a Google Scholar citation (IDs start with "pyOTFWoAAAAJ:" or "gs-id:")
        if _id.startswith("pyOTFWoAAAAJ:") or _id.startswith("gs-id:"):
            # For Google Scholar citations, we already have all the data we need
            # Just use the source as is
            citation = source
            log(f"Using Google Scholar data for citation: {source.get('title', 'No title')}", 1)
            log_to_file(f"Using Google Scholar data for citation: {source.get('title', 'No title')}", 1)
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
                    # Discard source from citations
                    continue

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