import re

#
def extract_dois_from_bibtex(bibtex_file):
    dois = []
    with open(bibtex_file, 'r') as file:
        bibtex_content = file.read()
        doi_pattern = re.compile(r'doi\s*=\s*{([^}]*)}')
        matches = doi_pattern.findall(bibtex_content)
        for match in matches:
            dois.append(match)
    return dois

# Usage example
bibtex_file = 'publications.bib'
dois = extract_dois_from_bibtex(bibtex_file)
print(dois)
# Export the list of DOIs to a file
output_file = 'output_file.txt'
with open(output_file, 'w') as file:
    for doi in dois:
        doi = doi.replace('https://doi.org/', '')
        file.write('- id: doi:'+doi + '\n')
print(f"List of DOIs exported to {output_file}")