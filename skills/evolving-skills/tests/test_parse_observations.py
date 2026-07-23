import unittest
import os
import shutil
import tempfile
import json
import sys

# Add scripts folder to sys.path for importing parse_observations
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../scripts")))
import parse_observations

class TestParseObservations(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.obs_dir = os.path.join(self.test_dir, "observations")
        self.archive_dir = os.path.join(self.obs_dir, "archive")
        os.makedirs(self.obs_dir, exist_ok=True)
        
        # Create a sample raw observation file
        self.sample_file = os.path.join(self.obs_dir, "2026-07-24-1200-systematic-debugging-failed-during-hypothesis.md")
        sample_content = """---
timestamp: 2026-07-24-1200
skill: systematic-debugging
phase: hypothesis
context_slug: test-failure
status: pending_distillation
---

# Superpower Observation Note

- **Observed Failure / Friction**: Skipped reading log before hypothesizing fix.
- **Verbatim Rationalization / Fallback**: "I'm 99% sure I know what failed."
- **Environment / Project Context**: Test suite error in python service.
- **Proposed Universal Improvement**: Add Red Flag for "I know what failed without looking".
"""
        with open(self.sample_file, "w", encoding="utf-8") as f:
            f.write(sample_content)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_list_observations(self):
        observations = parse_observations.list_observations(self.obs_dir)
        self.assertEqual(len(observations), 1)
        obs = observations[0]
        self.assertEqual(obs["skill"], "systematic-debugging")
        self.assertEqual(obs["phase"], "hypothesis")
        self.assertEqual(obs["status"], "pending_distillation")
        self.assertIn("Skipped reading log", obs["content"])

    def test_archive_observation(self):
        archived_path = parse_observations.archive_observation(self.sample_file, self.archive_dir)
        self.assertFalse(os.path.exists(self.sample_file))
        self.assertTrue(os.path.exists(archived_path))
        self.assertTrue(archived_path.startswith(self.archive_dir))

if __name__ == "__main__":
    unittest.main()
