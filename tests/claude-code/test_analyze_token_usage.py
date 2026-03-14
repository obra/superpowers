import sys
import unittest
import importlib.util
from pathlib import Path

# Add the parent directory to sys.path to import analyze_token_usage
sys.path.append(str(Path(__file__).parent.parent))

# Load module safely using importlib.util
module_path = str(Path(__file__).parent / 'analyze-token-usage.py')
spec = importlib.util.spec_from_file_location("analyze_token_usage", module_path)
analyze_token_usage = importlib.util.module_from_spec(spec)
sys.modules["analyze_token_usage"] = analyze_token_usage
spec.loader.exec_module(analyze_token_usage)

class TestCalculateCost(unittest.TestCase):

    def test_calculate_cost_default_rates(self):
        # Default costs: input $3/M, output $15/M
        usage = {
            'input_tokens': 1000000,
            'cache_creation': 0,
            'cache_read': 0,
            'output_tokens': 1000000
        }
        cost = analyze_token_usage.calculate_cost(usage)
        self.assertEqual(cost, 18.0)

    def test_calculate_cost_with_cache(self):
        # Test with cache usage
        usage_with_cache = {
            'input_tokens': 500000,
            'cache_creation': 250000,
            'cache_read': 250000,
            'output_tokens': 2000000
        }
        # Total input: 1M * 3 = 3
        # Total output: 2M * 15 = 30
        cost = analyze_token_usage.calculate_cost(usage_with_cache)
        self.assertEqual(cost, 33.0)

    def test_calculate_cost_custom_rates(self):
        usage = {
            'input_tokens': 1000000,
            'cache_creation': 0,
            'cache_read': 0,
            'output_tokens': 1000000
        }
        # Test with custom costs
        cost = analyze_token_usage.calculate_cost(usage, input_cost_per_m=5.0, output_cost_per_m=10.0)
        self.assertEqual(cost, 15.0)

    def test_calculate_cost_zero_usage(self):
        # Test zero usage
        zero_usage = {
            'input_tokens': 0,
            'cache_creation': 0,
            'cache_read': 0,
            'output_tokens': 0
        }
        cost = analyze_token_usage.calculate_cost(zero_usage)
        self.assertEqual(cost, 0.0)

    def test_calculate_cost_missing_keys(self):
        # Test with missing keys - should raise KeyError based on implementation
        missing_keys_usage = {
            'input_tokens': 1000000
        }
        with self.assertRaises(KeyError):
            analyze_token_usage.calculate_cost(missing_keys_usage)

if __name__ == '__main__':
    unittest.main()
