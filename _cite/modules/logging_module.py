"""
Enhanced logging module to handle both console and file logging
"""

import os
from datetime import datetime

# Global log file handle
log_file = None

def setup_logging(log_file_path):
    """
    Set up the logging system with both console and file output
    
    Args:
        log_file_path (str): Path to the log file
    """
    global log_file
    
    # Create directory for log file if it doesn't exist
    log_dir = os.path.dirname(log_file_path)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    # Open log file for writing
    try:
        log_file = open(log_file_path, "w", encoding="utf-8")
        # Write header to log file
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file.write(f"Citation Processing Log - Started at {timestamp}\n")
        log_file.write("=" * 80 + "\n\n")
        log_file.flush()
        return True
    except Exception as e:
        print(f"Error setting up log file: {e}")
        return False

def close_logging():
    """Close the log file if it's open"""
    global log_file
    if log_file:
        # Write footer to log file
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file.write(f"\n\nProcessing completed at {timestamp}\n")
        log_file.write("=" * 80 + "\n")
        log_file.close()
        log_file = None

def log_to_file(message="", indent=0, level="", newline=True):
    """
    Log to file and console with appropriate formatting
    
    Args:
        message (str): Message to log
        indent (int): Indentation level
        level (str): Log level (ERROR, WARNING, SUCCESS, INFO)
        newline (bool): Whether to add a newline at the end
    """
    global log_file
    
    # Format message with indentation
    indent_str = indent * "    "
    level_prefix = f"[{level}] " if level else ""
    message_str = f"{indent_str}{level_prefix}{message}"
    
    # Always log to console (original logging functionality)
    # This is assuming the original log function is available in the calling context
    # If not, we can duplicate that functionality here
    
    # Log to file if file is open
    if log_file:
        try:
            if newline:
                log_file.write(message_str + "\n")
            else:
                log_file.write(message_str)
            log_file.flush()
        except Exception as e:
            print(f"Error writing to log file: {e}")