"""
Pytest configuration for app tests.
Fixes Python path issues.
"""
import sys
import os

# Add parent directory to path so 'app' can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
