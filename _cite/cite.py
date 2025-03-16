#!/usr/bin/env python3
"""
Main citation processing script with improved duplicate detection and logging
"""

import os
import sys
import atexit
from pathlib import Path

# Add the current directory to the path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from util import log, save_data
from modules.logging_module import setup_logging, close_logging, log_to_file
from modules.source_processor import process_sources
from modules.citation_generator import generate_citations
from modules.deduplicator import deduplicate_citations
from modules.reporter import generate_reports

# Configuration
CONFIG = {
    "output_file": "_data/citations.yaml",
    "backup_file": "_data/citations.yaml.bak",
    "report_dir": "_cite/report",
    "plugins": ["pubmed", "orcid", "google-scholar", "sources"],
    "similarity_threshold": 0.95,  # Higher threshold to avoid false positives
    "text_report": "_cite/report/deduplication_summary.txt",
    "html_report": "_cite/report/citation_report.html",
    "log_file": "_cite/report/citation_processing.log"
}

def main():
    # Ensure report directory exists
    os.makedirs(CONFIG["report_dir"], exist_ok=True)
    
    # Set up logging to both console and file
    setup_logging(CONFIG["log_file"])
    
    # Register cleanup function to close log file on exit
    atexit.register(close_logging)
    
    # Initialize error flag
    error = False
    
    # Process all sources from plugins
    log()
    log_to_file()
    log("Compiling sources")
    log_to_file("Compiling sources")
    
    sources, all_sources, source_error = process_sources(CONFIG["plugins"])
    error = error or source_error
    
    if error:
        log("Errors occurred during source processing", level="ERROR")
        log_to_file("Errors occurred during source processing", level="ERROR")
        exit(1)
    
    log(f"{len(sources)} total source(s) to cite")
    log_to_file(f"{len(sources)} total source(s) to cite")
    
    # Generate citations from sources
    log()
    log_to_file()
    log("Generating citations")
    log_to_file("Generating citations")
    
    citations, all_citations, citation_error = generate_citations(sources)
    error = error or citation_error
    
    if error:
        log("Errors occurred during citation generation", level="ERROR")
        log_to_file("Errors occurred during citation generation", level="ERROR")
        exit(1)
    
    # Create backup of citations
    try:
        save_data(CONFIG["backup_file"], citations)
        log(f"Created backup at {CONFIG['backup_file']}", 1)
        log_to_file(f"Created backup at {CONFIG['backup_file']}", 1)
    except Exception as e:
        log(str(e), level="WARNING")
        log_to_file(str(e), level="WARNING")
        log("Continuing without backup", 1)
        log_to_file("Continuing without backup", 1)
    
    # Deduplicate citations
    log()
    log_to_file()
    log("Running deduplication with stricter matching criteria")
    log_to_file("Running deduplication with stricter matching criteria")
    
    deduplicated_citations, duplicate_groups, similarity_matrix, group_details = (
        deduplicate_citations(citations, CONFIG["similarity_threshold"])
    )
    
    log(f"Found {len(duplicate_groups)} groups of duplicate citations", 1)
    log_to_file(f"Found {len(duplicate_groups)} groups of duplicate citations", 1)
    
    if duplicate_groups:
        log(f"Deduplicated citations list now has {len(deduplicated_citations)} entries", 1)
        log_to_file(f"Deduplicated citations list now has {len(deduplicated_citations)} entries", 1)
        log(f"Removed {sum(len(group) - 1 for group in duplicate_groups)} duplicate citations", 1)
        log_to_file(f"Removed {sum(len(group) - 1 for group in duplicate_groups)} duplicate citations", 1)
    
    # Generate reports
    log()
    log_to_file()
    log("Generating detailed reports")
    log_to_file("Generating detailed reports")
    
    generate_reports(
        CONFIG["report_dir"],
        all_sources,
        all_citations,
        duplicate_groups,
        similarity_matrix,
        group_details
    )
    
    # Save final citations
    log()
    log_to_file()
    log("Saving updated citations")
    log_to_file("Saving updated citations")
    
    try:
        save_data(CONFIG["output_file"], deduplicated_citations)
    except Exception as e:
        log(str(e), level="ERROR")
        log_to_file(str(e), level="ERROR")
        error = True
    
    # Final status
    if error:
        log("Error(s) occurred above", level="ERROR")
        log_to_file("Error(s) occurred above", level="ERROR")
        exit(1)
    else:
        log("All done!", level="SUCCESS")
        log_to_file("All done!", level="SUCCESS")
        if duplicate_groups:
            log(f"\nCheck {CONFIG['text_report']} for a detailed deduplication summary", 1)
            log_to_file(f"\nCheck {CONFIG['text_report']} for a detailed deduplication summary", 1)
            log(f"A full HTML report is available at {CONFIG['html_report']}", 1)
            log_to_file(f"A full HTML report is available at {CONFIG['html_report']}", 1)
    
    log("\n")
    log_to_file("\n")

if __name__ == "__main__":
    main()