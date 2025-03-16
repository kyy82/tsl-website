"""
Module for generating enhanced reports about citation processing with file logging
"""

import os
import json
from datetime import datetime
from util import log
from modules.logging_module import log_to_file
from extended_util import citation_completeness_score, format_authors_for_display

def generate_reports(report_dir, all_sources, all_citations, duplicate_groups, 
                    similarity_matrix, group_details):
    """
    Generate HTML report and log files for citation processing
    
    Args:
        report_dir (str): Directory to save reports
        all_sources (list): All source entries
        all_citations (list): All citation entries
        duplicate_groups (list): Groups of duplicate citation indices
        similarity_matrix (dict): Matrix of similarity scores
        group_details (list): Details about how duplicates were handled
    """
    # Create HTML report
    html_report_file = os.path.join(report_dir, "citation_report.html")
    html_report = generate_html_report(all_sources, all_citations, duplicate_groups, 
                                      similarity_matrix, group_details)
    
    # Save HTML report
    with open(html_report_file, "w", encoding="utf-8") as f:
        f.write(html_report)
    
    log(f"HTML report saved to {html_report_file}", 1)
    log_to_file(f"HTML report saved to {html_report_file}", 1)
    
    # Create a detailed text report for quick review
    text_report_file = os.path.join(report_dir, "deduplication_summary.txt")
    text_report = generate_text_report(all_citations, duplicate_groups, group_details)
    
    # Save text report
    with open(text_report_file, "w", encoding="utf-8") as f:
        f.write(text_report)
    
    log(f"Text summary saved to {text_report_file}", 1)
    log_to_file(f"Text summary saved to {text_report_file}", 1)

def generate_text_report(all_citations, duplicate_groups, group_details):
    """Generate a plain text report of deduplication results for quick review"""
    
    # Identify Google Scholar-only entries
    google_scholar_only = []
    
    # Find citations that are only in Google Scholar
    for citation in all_citations:
        id_from_gs = citation.get('id', '').startswith('gs-id:') or citation.get('id', '').startswith('pyOTFWoAAAAJ:')
        plugin_is_gs = citation.get('plugin') == 'google-scholar.py'
        
        if (id_from_gs or plugin_is_gs) and not any(
            c.get('id') == citation.get('id') and c.get('plugin') != 'google-scholar.py' 
            for c in all_citations if c != citation
        ):
            google_scholar_only.append(citation)
    
    report = "CITATION DEDUPLICATION SUMMARY\n"
    report += "=" * 30 + "\n\n"
    
    report += f"Total citations: {len(all_citations)}\n"
    report += f"Duplicate groups found: {len(duplicate_groups)}\n"
    report += f"Citations removed: {sum(len(group) - 1 for group in duplicate_groups)}\n"
    report += f"Final citation count: {len(all_citations) - sum(len(group) - 1 for group in duplicate_groups)}\n"
    report += f"Google Scholar only entries: {len(google_scholar_only)}\n\n"
    
    if not group_details:
        report += "No duplicates were found and removed.\n"
        return report
    
    report += "DETAILS OF DUPLICATE GROUPS\n"
    report += "-" * 30 + "\n\n"
    
    for group in group_details:
        kept = group['kept_citation']
        kept_citation = kept['citation']
        
        title = kept_citation.get('title', 'No title')
        authors = format_authors_for_display(kept_citation.get('authors', []))
        publisher = kept_citation.get('publisher', 'Unknown source')
        date = kept_citation.get('date', 'Unknown date')
        
        report += f"GROUP {group['group_id']}:\n"
        report += f"  KEPT: \"{title}\" \n"
        report += f"        by {authors}\n"
        report += f"        in {publisher} ({date})\n"
        report += f"        Score: {kept['score']:.2f}\n"
        report += f"        ID: {kept_citation.get('id', 'No ID')}\n\n"
        
        if group['removed_citations']:
            report += "  REMOVED:\n"
            
            for removed in group['removed_citations']:
                r_citation = removed['citation']
                r_title = r_citation.get('title', 'No title')
                r_authors = format_authors_for_display(r_citation.get('authors', []))
                r_publisher = r_citation.get('publisher', 'Unknown source')
                r_date = r_citation.get('date', 'Unknown date')
                
                report += f"    - \"{r_title}\" \n"
                report += f"      by {r_authors}\n"
                report += f"      in {r_publisher} ({r_date})\n"
                report += f"      Score: {removed['score']:.2f}\n"
                report += f"      ID: {r_citation.get('id', 'No ID')}\n\n"
        
        report += "-" * 30 + "\n\n"
    
    # Add section for Google Scholar-only entries
    if google_scholar_only:
        report += "GOOGLE SCHOLAR ONLY ENTRIES\n"
        report += "-" * 30 + "\n\n"
        report += f"Found {len(google_scholar_only)} entries that exist only in Google Scholar:\n\n"
        
        for idx, citation in enumerate(google_scholar_only):
            title = citation.get('title', 'No title')
            authors = format_authors_for_display(citation.get('authors', []))
            publisher = citation.get('publisher', 'Unknown source')
            date = citation.get('date', 'Unknown date')
            id_str = citation.get('id', 'No ID')
            
            report += f"{idx+1}. \"{title}\" \n"
            report += f"   by {authors}\n"
            report += f"   in {publisher} ({date})\n"
            report += f"   ID: {id_str}\n\n"
        
        report += "-" * 30 + "\n\n"
        report += "NOTE: These entries might need to be properly cataloged in your sources.\n\n"
    
    return report

def generate_html_report(all_sources, all_citations, duplicate_groups, 
                        similarity_matrix, group_details):
    """
    Generate HTML report content
    
    Args:
        all_sources (list): All source entries
        all_citations (list): All citation entries
        duplicate_groups (list): Groups of duplicate citation indices
        similarity_matrix (dict): Matrix of similarity scores
        group_details (list): Details about how duplicates were handled
    
    Returns:
        str: HTML report content
    """
    # Identify Google Scholar-only entries
    google_scholar_only = []
    gs_ids = set()
    
    # Find all citations from Google Scholar
    for citation in all_citations:
        if citation.get('plugin') == 'google-scholar.py' or citation.get('id', '').startswith('gs-id:') or citation.get('id', '').startswith('pyOTFWoAAAAJ:'):
            # Store identifier to check if it's unique to Google Scholar
            if citation.get('id'):
                gs_ids.add(citation.get('id'))
    
    # Find citations that are only in Google Scholar and not in other sources
    for citation in all_citations:
        id_from_gs = citation.get('id', '').startswith('gs-id:') or citation.get('id', '').startswith('pyOTFWoAAAAJ:')
        plugin_is_gs = citation.get('plugin') == 'google-scholar.py'
        
        if (id_from_gs or plugin_is_gs) and not any(
            c.get('id') == citation.get('id') and c.get('plugin') != 'google-scholar.py' 
            for c in all_citations if c != citation
        ):
            google_scholar_only.append(citation)
    
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Citation Processing Report</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 20px;
                color: #333;
            }
            h1, h2, h3 {
                color: #2c3e50;
            }
            .section {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                padding: 8px;
                text-align: left;
                border: 1px solid #ddd;
                vertical-align: top;
            }
            th {
                background-color: #f2f2f2;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .duplicate-group {
                margin-bottom: 20px;
                padding: 10px;
                border-left: 4px solid #3498db;
                background-color: #f8f9fa;
            }
            .kept {
                background-color: #d4edda;
            }
            .removed {
                background-color: #f8d7da;
                text-decoration: line-through;
            }
            .similarity-high {
                background-color: #ffcccc;
            }
            .similarity-medium {
                background-color: #ffffcc;
            }
            .nav {
                position: sticky;
                top: 0;
                background: white;
                padding: 10px 0;
                border-bottom: 1px solid #ddd;
                margin-bottom: 20px;
                z-index: 100;
            }
            .nav a {
                margin-right: 15px;
                text-decoration: none;
                color: #3498db;
            }
            pre {
                white-space: pre-wrap;
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
            .stats {
                background-color: #e9f7fe;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .citation-meta {
                font-size: 0.9em;
                margin-top: 5px;
                color: #666;
            }
            .title {
                font-weight: bold;
            }
            .authors {
                font-style: italic;
            }
            .filter-box {
                margin: 10px 0;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 5px;
            }
            .filter-box input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .gs-entry {
                background-color: #e9ffef;
            }
        </style>
        <script>
            // Simple filter function for tables
            function filterTable(inputId, tableId) {
                var input = document.getElementById(inputId);
                var filter = input.value.toLowerCase();
                var table = document.getElementById(tableId);
                var rows = table.getElementsByTagName("tr");
                
                for (var i = 1; i < rows.length; i++) { // Skip header row
                    var text = rows[i].textContent.toLowerCase();
                    if (text.indexOf(filter) > -1) {
                        rows[i].style.display = "";
                    } else {
                        rows[i].style.display = "none";
                    }
                }
            }
        </script>
    </head>
    <body>
        <h1>Citation Processing Report</h1>
        <p>Generated on: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
        
        <div class="nav">
            <a href="#summary">Summary</a>
            <a href="#sources">All Sources</a>
            <a href="#citations">All Citations</a>
            <a href="#duplicates">Duplicate Groups</a>
            <a href="#google-scholar">Google Scholar Only</a>
        </div>
        
        <div class="section stats" id="summary">
            <h2>Summary</h2>
            <p><strong>Total Sources:</strong> """ + str(len(all_sources)) + """</p>
            <p><strong>Total Citations:</strong> """ + str(len(all_citations)) + """</p>
            <p><strong>Duplicate Groups Found:</strong> """ + str(len(duplicate_groups)) + """</p>
            <p><strong>Citations After Deduplication:</strong> """ + str(len(all_citations) - sum(len(group) - 1 for group in duplicate_groups)) + """</p>
            <p><strong>Google Scholar Only Entries:</strong> """ + str(len(google_scholar_only)) + """</p>
        </div>
        
        <div class="section" id="sources">
            <h2>All Sources</h2>
            
            <div class="filter-box">
                <input type="text" id="sourceFilter" onkeyup="filterTable('sourceFilter', 'sourcesTable')" placeholder="Filter sources...">
            </div>
            
            <table id="sourcesTable">
                <tr>
                    <th>Index</th>
                    <th>ID</th>
                    <th>Plugin</th>
                    <th>File</th>
                    <th>Title</th>
                </tr>
    """
    
    # Add all sources
    for idx, source in enumerate(all_sources):
        html += f"""
                <tr>
                    <td>{idx}</td>
                    <td>{source.get('id', '')}</td>
                    <td>{source.get('plugin', '')}</td>
                    <td>{source.get('file', '')}</td>
                    <td>{source.get('title', '')}</td>
                </tr>
        """
    
    html += """
            </table>
        </div>
        
        <div class="section" id="citations">
            <h2>All Citations</h2>
            
            <div class="filter-box">
                <input type="text" id="citationFilter" onkeyup="filterTable('citationFilter', 'citationsTable')" placeholder="Filter citations...">
            </div>
            
            <table id="citationsTable">
                <tr>
                    <th>Index</th>
                    <th>ID</th>
                    <th>Citation Details</th>
                    <th>Publisher</th>
                    <th>Date</th>
                    <th>Score</th>
                </tr>
    """
    
    # Add all citations
    for idx, citation in enumerate(all_citations):
        score = citation_completeness_score(citation)
        title = citation.get("title", "No title")
        authors = ", ".join(citation.get("authors", []))
        publisher = citation.get("publisher", "")
        date = citation.get("date", "")
        
        # Check if this is a Google Scholar-only entry
        is_gs_only = citation in google_scholar_only
        row_class = "gs-entry" if is_gs_only else ""
        
        html += f"""
                <tr class="{row_class}">
                    <td>{idx}</td>
                    <td>{citation.get('id', '')}</td>
                    <td>
                        <div class="title">{title}</div>
                        <div class="authors">{authors}</div>
                    </td>
                    <td>{publisher}</td>
                    <td>{date}</td>
                    <td>{score:.2f}</td>
                </tr>
        """
    
    html += """
            </table>
        </div>
        
        <div class="section" id="duplicates">
            <h2>Duplicate Groups</h2>
            
            <div class="filter-box">
                <input type="text" id="duplicateFilter" onkeyup="filterDuplicates(this.value)" placeholder="Filter duplicate groups...">
            </div>
            
            <script>
                function filterDuplicates(filter) {
                    filter = filter.toLowerCase();
                    var groups = document.querySelectorAll('.duplicate-group');
                    
                    groups.forEach(function(group) {
                        var text = group.textContent.toLowerCase();
                        if (text.indexOf(filter) > -1) {
                            group.style.display = "";
                        } else {
                            group.style.display = "none";
                        }
                    });
                }
            </script>
    """
    
    # Add duplicate groups
    if group_details:
        for group in group_details:
            kept = group['kept_citation']
            kept_citation = kept['citation']
            
            html += f"""
                <div class="duplicate-group">
                    <h3>Group {group['group_id']}</h3>
                    <h4>Kept Citation (Score: {kept['score']:.2f})</h4>
                    <div class="kept">
                        <p><strong>Title:</strong> {kept_citation.get('title', 'No title')}</p>
                        <p><strong>Authors:</strong> {', '.join(kept_citation.get('authors', []))}</p>
                        <p><strong>Publisher:</strong> {kept_citation.get('publisher', 'Unknown')}</p>
                        <p><strong>Date:</strong> {kept_citation.get('date', 'Unknown')}</p>
                        <p><strong>ID:</strong> {kept_citation.get('id', 'No ID')}</p>
                        <details>
                            <summary>Full Citation Data</summary>
                            <pre>{json.dumps(kept_citation, indent=2)}</pre>
                        </details>
                    </div>
                    
                    <h4>Removed Citations</h4>
            """
            
            for removed in group['removed_citations']:
                r_citation = removed['citation']
                
                html += f"""
                    <div class="removed">
                        <p><strong>Title:</strong> {r_citation.get('title', 'No title')}</p>
                        <p><strong>Authors:</strong> {', '.join(r_citation.get('authors', []))}</p>
                        <p><strong>Publisher:</strong> {r_citation.get('publisher', 'Unknown')}</p>
                        <p><strong>Date:</strong> {r_citation.get('date', 'Unknown')}</p>
                        <p><strong>ID:</strong> {r_citation.get('id', 'No ID')}</p>
                        <p><strong>Score:</strong> {removed['score']:.2f}</p>
                        <details>
                            <summary>Full Citation Data</summary>
                            <pre>{json.dumps(r_citation, indent=2)}</pre>
                        </details>
                    </div>
                """
            
            html += """
                </div>
            """
    else:
        html += "<p>No duplicate groups found.</p>"
    
    html += """
        </div>
        
        <div class="section" id="similarity">
            <h2>Similarity Matrix</h2>
            <p>Showing pairs with similarity > 0.7</p>
            
            <div class="filter-box">
                <input type="text" id="similarityFilter" onkeyup="filterTable('similarityFilter', 'similarityTable')" placeholder="Filter similarity matrix...">
            </div>
            
            <table id="similarityTable">
                <tr>
                    <th>Index 1</th>
                    <th>Index 2</th>
                    <th>Title 1</th>
                    <th>Title 2</th>
                    <th>Similarity</th>
                </tr>
    """
    
    
    # Add Google Scholar-only entries
    if google_scholar_only:
        for citation in google_scholar_only:
            title = citation.get('title', 'No title')
            authors = ", ".join(citation.get('authors', []))
            publisher = citation.get('publisher', '')
            date = citation.get('date', '')
            id_str = citation.get('id', '')
            link = citation.get('link', '')
            
            html += f"""
                <tr>
                    <td>{title}</td>
                    <td>{authors}</td>
                    <td>{publisher}</td>
                    <td>{date}</td>
                    <td>{id_str}</td>
                    <td><a href="{link}" target="_blank">{link}</a></td>
                </tr>
            """
    else:
        html += """
                <tr>
                    <td colspan="6">No Google Scholar-only entries found.</td>
                </tr>
        """
    
    html += """
            </table>
        </div>
    </body>
    </html>
    """
    
    return html