"""
Xcode build automation module.

Provides structured, modular access to xcodebuild and xcresult functionality.
"""

from .builder import BuildRunner
from .cache import XCResultCache
from .config import Config
from .reporter import OutputFormatter
from .xcresult import XCResultParser

__all__ = ["BuildRunner", "Config", "OutputFormatter", "XCResultCache", "XCResultParser"]
