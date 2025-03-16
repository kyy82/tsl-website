"""
Extended utility functions for the citation processing system
"""

# Import original utilities
from util import *

def citation_completeness_score(citation):
    """
    Calculate a score representing how complete/detailed a citation is
    Higher score = more detailed citation
    """
    score = 0
    
    # Basic properties with weighted importance
    if citation.get("title"):
        score += 1.5
    if citation.get("date"):
        score += 1
    if citation.get("publisher"):
        score += 1
    if citation.get("link"):
        score += 0.5
    
    # Authors - more authors = more detail
    authors = citation.get("authors", [])
    if authors:
        score += min(len(authors), 5) / 5  # Cap at 5 for scoring
    
    # Groups/special markings are valuable
    if citation.get("group"):
        score += 1.5
    
    # Images are valuable
    if citation.get("image"):
        score += 2
    
    # DOI is very valuable
    if citation.get("id") and citation.get("id").startswith("doi:"):
        score += 1
    
    # Additional fields add value
    if citation.get("description"):
        score += 1
    
    # Favor direct sources over Google Scholar
    if citation.get("plugin") and "google-scholar" in citation.get("plugin"):
        score -= 0.5
    
    # Favor sources explicitly added to sources.yaml
    if citation.get("plugin") and "sources.py" in citation.get("plugin"):
        score += 2
    
    return score

def format_authors_for_display(authors):
    """Format author list for display in logs and reports"""
    if not authors:
        return "Unknown authors"
    
    if len(authors) == 1:
        return authors[0]
    
    if len(authors) == 2:
        return f"{authors[0]} and {authors[1]}"
    
    return f"{authors[0]} et al."