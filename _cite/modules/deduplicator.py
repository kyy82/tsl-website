"""
Module for deduplicating citations with improved detection and logging
"""

import re
from difflib import SequenceMatcher
from util import log
from extended_util import citation_completeness_score

def deduplicate_citations(citations, similarity_threshold=0.9):
    """
    Find and remove duplicate citations with more stringent criteria
    
    Args:
        citations (list): List of citation dictionaries
        similarity_threshold (float): Threshold for title similarity (0.0-1.0)
        
    Returns:
        tuple: (deduplicated_citations, duplicate_groups, similarity_matrix, group_details)
    """
    # Create a deep copy of citations to avoid modifying the original
    citations_copy = [citation.copy() for citation in citations]
    
    # Find duplicate groups
    duplicate_groups, similarity_matrix = find_duplicates(citations_copy, similarity_threshold)
    
    # If no duplicates found, return original citations
    if not duplicate_groups:
        return citations_copy, duplicate_groups, similarity_matrix, []
    
    # Merge duplicate groups and get details
    deduplicated_citations, group_details = merge_duplicate_groups(citations_copy, duplicate_groups)
    
    return deduplicated_citations, duplicate_groups, similarity_matrix, group_details

def normalize_title(title):
    """Normalize title for comparison by removing punctuation and lowercasing"""
    if not title:
        return ""
    return re.sub(r'[^\w\s]', '', title.lower())

def title_similarity(title1, title2):
    """Calculate similarity between two titles using SequenceMatcher"""
    if not title1 or not title2:
        return 0
    
    # Normalize titles
    norm_title1 = normalize_title(title1)
    norm_title2 = normalize_title(title2)
    
    # Calculate similarity
    return SequenceMatcher(None, norm_title1, norm_title2).ratio()

def are_identical_titles(title1, title2):
    """Check if two titles are effectively identical after normalization"""
    norm_title1 = normalize_title(title1)
    norm_title2 = normalize_title(title2)
    
    # Exact match after normalization
    if norm_title1 == norm_title2:
        return True
    
    # Very high similarity (99%+) usually indicates same title with minor punctuation differences
    similarity = SequenceMatcher(None, norm_title1, norm_title2).ratio()
    return similarity >= 0.99

def find_duplicates(citations, similarity_threshold):
    """
    Find groups of similar citations based on stricter criteria:
    1. Exact match on DOI (highest priority)
    2. Identical titles after normalization
    3. Very high similarity score + same first author
    """
    duplicate_groups = []
    similarity_matrix = {}  # Store similarity scores for reporting
    used_indices = set()
    
    # First pass: group by DOI (most reliable identifier)
    doi_groups = {}
    for i, citation in enumerate(citations):
        doi = None
        if citation.get("id") and citation.get("id").startswith("doi:"):
            doi = citation.get("id")
        
        if doi:
            if doi not in doi_groups:
                doi_groups[doi] = []
            doi_groups[doi].append(i)
    
    # Add DOI-based groups to duplicate groups
    for doi, indices in doi_groups.items():
        if len(indices) > 1:
            duplicate_groups.append(indices)
            used_indices.update(indices)
    
    # Second pass: look for identical titles (after normalization)
    for i in range(len(citations)):
        if i in used_indices:
            continue
            
        title_i = citations[i].get("title", "")
        if not title_i:
            continue
            
        group = [i]
        used_indices.add(i)
        
        for j in range(i+1, len(citations)):
            if j in used_indices:
                continue
                
            title_j = citations[j].get("title", "")
            if not title_j:
                continue
            
            # Check if titles are effectively identical
            if are_identical_titles(title_i, title_j):
                group.append(j)
                used_indices.add(j)
                continue
            
            # Calculate similarity for reporting
            similarity = title_similarity(title_i, title_j)
            
            # Store similarity for reporting
            key = f"{i},{j}"
            similarity_matrix[key] = {
                "index1": i,
                "index2": j,
                "title1": title_i,
                "title2": title_j,
                "similarity": similarity
            }
            
            # Only consider very high similarity titles with same first author
            if similarity > similarity_threshold:
                # Check if first authors match
                authors_i = citations[i].get("authors", [])
                authors_j = citations[j].get("authors", [])
                
                first_author_match = False
                if authors_i and authors_j:
                    # Get normalized versions of first authors
                    first_author_i = authors_i[0].lower().strip() if authors_i else ""
                    first_author_j = authors_j[0].lower().strip() if authors_j else ""
                    
                    # Check for first author match with high threshold
                    first_author_match = (SequenceMatcher(None, first_author_i, first_author_j).ratio() > 0.9)
                
                if first_author_match:
                    group.append(j)
                    used_indices.add(j)
        
        if len(group) > 1:
            duplicate_groups.append(group)
    
    return duplicate_groups, similarity_matrix

def merge_duplicate_groups(citations, duplicate_groups):
    """Merge each group of duplicates, keeping the most detailed citation"""
    # List of indices to remove
    to_remove = []
    group_details = []
    
    for group_id, group in enumerate(duplicate_groups):
        # Score each citation in the group
        scored_group = [(idx, citation_completeness_score(citations[idx]), citations[idx]) for idx in group]
        # Sort by score in descending order
        scored_group.sort(key=lambda x: x[1], reverse=True)
        
        # Keep the highest-scored citation, remove the rest
        keep_idx = scored_group[0][0]
        kept_citation = citations[keep_idx]
        
        # Get publisher/journal information for logging
        kept_publisher = kept_citation.get("publisher", "Unknown source")
        
        group_info = {
            "group_id": group_id + 1,
            "kept_citation": {
                "index": keep_idx,
                "score": scored_group[0][1],
                "citation": kept_citation 
            },
            "removed_citations": []
        }
        
        log(f"Group {group_id+1}: Keeping citation: \"{kept_citation.get('title', 'No title')}\" from {kept_publisher}", 2)
        
        for idx, score, citation in scored_group[1:]:
            publisher = citation.get("publisher", "Unknown source")
            log(f"  Removing duplicate: \"{citation.get('title', 'No title')}\" from {publisher} (score: {score:.2f} vs {scored_group[0][1]:.2f})", 3)
            
            to_remove.append(idx)
            group_info["removed_citations"].append({
                "index": idx,
                "score": score,
                "citation": citation
            })
        
        group_details.append(group_info)
    
    # Remove the duplicates (in reverse order to keep indices valid)
    for idx in sorted(to_remove, reverse=True):
        del citations[idx]
    
    return citations, group_details