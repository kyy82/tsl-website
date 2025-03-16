"""
Module for processing citation sources from various plugins with file logging
"""

import traceback
from importlib import import_module
from pathlib import Path
from util import log, load_data, get_safe, label
from modules.logging_module import log_to_file

def process_sources(plugins):
    """
    Process sources from all plugins
    
    Args:
        plugins (list): List of plugin names to process
        
    Returns:
        tuple: (sources, all_sources, error_flag)
    """
    # Track if any errors occurred
    error = False
    
    # compiled list of sources
    sources = []
    
    # store all original sources for reporting
    all_sources = []
    
    # loop through plugins
    for plugin in plugins:
        # convert into path object
        plugin = Path(f"plugins/{plugin}.py")

        log(f"Running {plugin.stem} plugin")
        log_to_file(f"Running {plugin.stem} plugin")

        # get all data files to process with current plugin
        files = Path.cwd().glob(f"_data/{plugin.stem}*.*")
        files = list(filter(lambda p: p.suffix in [".yaml", ".yml", ".json"], files))

        log(f"Found {len(files)} {plugin.stem}* data file(s)", 1)
        log_to_file(f"Found {len(files)} {plugin.stem}* data file(s)", 1)

        # loop through data files
        for file in files:
            log(f"Processing data file {file.name}", 1)
            log_to_file(f"Processing data file {file.name}", 1)

            # load data from file
            try:
                data = load_data(file)
                # check if file in correct format
                if not list_of_dicts(data):
                    raise Exception("File not a list of dicts")
            except Exception as e:
                log(e, 2, "ERROR")
                log_to_file(e, 2, "ERROR")
                error = True
                continue

            # loop through data entries
            for index, entry in enumerate(data):
                log(f"Processing entry {index + 1} of {len(data)}, {label(entry)}", 2)
                log_to_file(f"Processing entry {index + 1} of {len(data)}, {label(entry)}", 2)

                # run plugin on data entry to expand into multiple sources
                try:
                    expanded = import_module(f"plugins.{plugin.stem}").main(entry)
                    # check that plugin returned correct format
                    if not list_of_dicts(expanded):
                        raise Exception("Plugin didn't return list of dicts")
                # catch any plugin error
                except Exception as e:
                    # log detailed pre-formatted/colored trace
                    error_trace = traceback.format_exc()
                    print(error_trace)
                    log_to_file(error_trace)
                    # log high-level error
                    log(e, 3, "ERROR")
                    log_to_file(e, 3, "ERROR")
                    error = True
                    continue

                # loop through sources
                for source in expanded:
                    if plugin.stem != "sources":
                        log(label(source), 3)
                        log_to_file(label(source), 3)

                    # include meta info about source
                    source["plugin"] = plugin.name
                    source["file"] = file.name
                    
                    # Store original source for reporting
                    all_sources.append(source.copy())

                    # add source to compiled list
                    sources.append(source)

                if plugin.stem != "sources":
                    log(f"{len(expanded)} source(s)", 3)
                    log_to_file(f"{len(expanded)} source(s)", 3)

    # Merge sources with matching IDs
    log("Merging sources by id")
    log_to_file("Merging sources by id")
    
    # merge sources with matching (non-blank) ids
    for a in range(0, len(sources)):
        a_id = get_safe(sources, f"{a}.id", "")
        if not a_id:
            continue
        for b in range(a + 1, len(sources)):
            b_id = get_safe(sources, f"{b}.id", "")
            if b_id == a_id:
                log(f"Found duplicate {b_id}", 2)
                log_to_file(f"Found duplicate {b_id}", 2)
                sources[a].update(sources[b])
                sources[b] = {}
    
    # Remove empty entries
    sources = [entry for entry in sources if entry]
    
    return sources, all_sources, error

def list_of_dicts(data):
    """Check if data is a list of dictionaries"""
    return isinstance(data, list) and all(isinstance(entry, dict) for entry in data)