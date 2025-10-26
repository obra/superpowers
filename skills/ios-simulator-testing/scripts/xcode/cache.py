"""
XCResult cache management.

Handles storage, retrieval, and lifecycle of xcresult bundles for progressive disclosure.
"""

import shutil
from datetime import datetime
from pathlib import Path


class XCResultCache:
    """
    Manage xcresult bundle cache for progressive disclosure.

    Stores xcresult bundles with timestamp-based IDs and provides
    retrieval and cleanup operations.
    """

    # Default cache directory
    DEFAULT_CACHE_DIR = Path.home() / ".ios-simulator-skill" / "xcresults"

    def __init__(self, cache_dir: Path | None = None):
        """
        Initialize cache manager.

        Args:
            cache_dir: Custom cache directory (uses default if not specified)
        """
        self.cache_dir = cache_dir or self.DEFAULT_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def generate_id(self, prefix: str = "xcresult") -> str:
        """
        Generate timestamped xcresult ID.

        Args:
            prefix: ID prefix (default: "xcresult")

        Returns:
            ID string like "xcresult-20251018-143052"
        """
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"{prefix}-{timestamp}"

    def get_path(self, xcresult_id: str) -> Path:
        """
        Get full path for xcresult ID.

        Args:
            xcresult_id: XCResult ID

        Returns:
            Path to xcresult bundle
        """
        # Handle both with and without .xcresult extension
        if xcresult_id.endswith(".xcresult"):
            return self.cache_dir / xcresult_id
        return self.cache_dir / f"{xcresult_id}.xcresult"

    def exists(self, xcresult_id: str) -> bool:
        """
        Check if xcresult bundle exists.

        Args:
            xcresult_id: XCResult ID

        Returns:
            True if bundle exists
        """
        return self.get_path(xcresult_id).exists()

    def save(self, source_path: Path, xcresult_id: str | None = None) -> str:
        """
        Save xcresult bundle to cache.

        Args:
            source_path: Source xcresult bundle path
            xcresult_id: Optional custom ID (generates if not provided)

        Returns:
            xcresult ID
        """
        if not source_path.exists():
            raise FileNotFoundError(f"Source xcresult not found: {source_path}")

        # Generate ID if not provided
        if not xcresult_id:
            xcresult_id = self.generate_id()

        # Get destination path
        dest_path = self.get_path(xcresult_id)

        # Copy xcresult bundle (it's a directory)
        if dest_path.exists():
            shutil.rmtree(dest_path)

        shutil.copytree(source_path, dest_path)

        return xcresult_id

    def list(self, limit: int = 10) -> list[dict]:
        """
        List recent xcresult bundles.

        Args:
            limit: Maximum number to return

        Returns:
            List of xcresult metadata dicts
        """
        if not self.cache_dir.exists():
            return []

        results = []
        for path in sorted(
            self.cache_dir.glob("*.xcresult"), key=lambda p: p.stat().st_mtime, reverse=True
        )[:limit]:
            # Calculate bundle size
            size_bytes = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())

            results.append(
                {
                    "id": path.stem,
                    "path": str(path),
                    "created": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
                    "size_mb": round(size_bytes / (1024 * 1024), 2),
                }
            )

        return results

    def cleanup(self, keep_recent: int = 20) -> int:
        """
        Clean up old xcresult bundles.

        Args:
            keep_recent: Number of recent bundles to keep

        Returns:
            Number of bundles removed
        """
        if not self.cache_dir.exists():
            return 0

        # Get all bundles sorted by modification time
        all_bundles = sorted(
            self.cache_dir.glob("*.xcresult"), key=lambda p: p.stat().st_mtime, reverse=True
        )

        # Remove old bundles
        removed = 0
        for bundle_path in all_bundles[keep_recent:]:
            shutil.rmtree(bundle_path)
            removed += 1

        return removed

    def get_size_mb(self, xcresult_id: str) -> float:
        """
        Get size of xcresult bundle in MB.

        Args:
            xcresult_id: XCResult ID

        Returns:
            Size in MB
        """
        path = self.get_path(xcresult_id)
        if not path.exists():
            return 0.0

        size_bytes = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
        return round(size_bytes / (1024 * 1024), 2)

    def save_stderr(self, xcresult_id: str, stderr: str) -> None:
        """
        Save stderr output alongside xcresult bundle.

        Args:
            xcresult_id: XCResult ID
            stderr: stderr output from xcodebuild
        """
        if not stderr:
            return

        stderr_path = self.cache_dir / f"{xcresult_id}.stderr"
        stderr_path.write_text(stderr, encoding="utf-8")

    def get_stderr(self, xcresult_id: str) -> str:
        """
        Retrieve cached stderr output.

        Args:
            xcresult_id: XCResult ID

        Returns:
            stderr content or empty string if not found
        """
        stderr_path = self.cache_dir / f"{xcresult_id}.stderr"
        if not stderr_path.exists():
            return ""

        return stderr_path.read_text(encoding="utf-8")
