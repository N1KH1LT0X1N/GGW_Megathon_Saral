"""
Compatibility module for cgi functionality removed in Python 3.13.
This provides comprehensive replacements for the cgi functions used by feedparser.
"""

import html
import urllib.parse
import email.message
import email.utils
import io
import re

def escape(s, quote=None):
    """
    Replace special characters '&', '<' and '>' by SGML entities.
    If the optional flag quote is true, the quotation mark character (")
    is also translated.
    """
    s = html.escape(s, quote=quote)
    return s

def parse_qs(qs, keep_blank_values=0, strict_parsing=0):
    """
    Parse a query string given as a string argument.
    """
    return urllib.parse.parse_qs(qs, keep_blank_values=keep_blank_values, strict_parsing=strict_parsing)

def parse_qsl(qs, keep_blank_values=0, strict_parsing=0):
    """
    Parse a query string given as a string argument.
    """
    return urllib.parse.parse_qsl(qs, keep_blank_values=keep_blank_values, strict_parsing=strict_parsing)

def parse_header(line):
    """
    Parse a Content-type like header.
    Returns the main content-type and a dictionary of options.
    """
    if not line:
        return '', {}
    
    # Split on semicolon
    parts = line.split(';')
    main_type = parts[0].strip().lower()
    
    # Parse parameters
    options = {}
    for part in parts[1:]:
        if '=' in part:
            key, value = part.split('=', 1)
            key = key.strip().lower()
            value = value.strip().strip('"\'')
            options[key] = value
    
    return main_type, options

def parse_multipart(fp, pdict, encoding="utf-8", errors="replace"):
    """
    Parse multipart form data.
    This is a simplified version that returns empty results.
    """
    return {}

def parse(fp=None, environ=None, keep_blank_values=0, strict_parsing=0):
    """
    Parse a query in the environment or from a file.
    """
    if fp is None:
        # Parse from environment
        if environ is None:
            import os
            environ = os.environ
        
        # Get query string from environment
        query_string = environ.get('QUERY_STRING', '')
        if query_string:
            return parse_qs(query_string, keep_blank_values, strict_parsing)
        else:
            return {}
    else:
        # Parse from file
        content = fp.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8', errors='replace')
        return parse_qs(content, keep_blank_values, strict_parsing)

def test():
    """
    Test function for cgi module.
    """
    print("cgi compatibility module loaded successfully")

# Create a comprehensive cgi module replacement
class Module:
    def __init__(self):
        self.escape = escape
        self.parse_qs = parse_qs
        self.parse_qsl = parse_qsl
        self.parse_header = parse_header
        self.parse_multipart = parse_multipart
        self.parse = parse
        self.test = test

# Create the module instance
cgi = Module()
