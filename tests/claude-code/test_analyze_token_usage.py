import unittest
import os
import json
import importlib.util
import tempfile

# Import the module with a dash in its name
spec = importlib.util.spec_from_file_location(
    "analyze_token_usage",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "analyze-token-usage.py")
)
analyze_token_usage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyze_token_usage)

class TestAnalyzeTokenUsage(unittest.TestCase):
    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.jsonl')
        self.test_file = self.temp_file.name

    def tearDown(self):
        self.temp_file.close()
        if os.path.exists(self.test_file):
            os.remove(self.test_file)

    def write_jsonl(self, data):
        with open(self.test_file, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')

    def test_analyze_main_session_empty(self):
        self.write_jsonl([])
        main_usage, subagent_usage = analyze_token_usage.analyze_main_session(self.test_file)

        self.assertEqual(main_usage['messages'], 0)
        self.assertEqual(len(subagent_usage), 0)

    def test_analyze_main_session_assistant_messages(self):
        data = [
            {
                "type": "assistant",
                "message": {
                    "usage": {
                        "input_tokens": 100,
                        "output_tokens": 50,
                        "cache_creation_input_tokens": 10,
                        "cache_read_input_tokens": 5
                    }
                }
            },
            {
                "type": "assistant",
                "message": {
                    "usage": {
                        "input_tokens": 200,
                        "output_tokens": 100
                    }
                }
            }
        ]
        self.write_jsonl(data)
        main_usage, subagent_usage = analyze_token_usage.analyze_main_session(self.test_file)

        self.assertEqual(main_usage['messages'], 2)
        self.assertEqual(main_usage['input_tokens'], 300)
        self.assertEqual(main_usage['output_tokens'], 150)
        self.assertEqual(main_usage['cache_creation'], 10)
        self.assertEqual(main_usage['cache_read'], 5)
        self.assertEqual(len(subagent_usage), 0)

    def test_analyze_main_session_subagent_messages(self):
        data = [
            {
                "type": "user",
                "toolUseResult": {
                    "agentId": "agent-123",
                    "usage": {
                        "input_tokens": 150,
                        "output_tokens": 75,
                        "cache_creation_input_tokens": 20,
                        "cache_read_input_tokens": 0
                    },
                    "prompt": "You are a helpful assistant.\nThis is a test prompt."
                }
            },
            {
                "type": "user",
                "toolUseResult": {
                    "agentId": "agent-123",
                    "usage": {
                        "input_tokens": 50,
                        "output_tokens": 25
                    }
                }
            },
            {
                "type": "user",
                "toolUseResult": {
                    "agentId": "agent-456",
                    "usage": {
                        "input_tokens": 300,
                        "output_tokens": 100
                    },
                    "prompt": "Test agent 2."
                }
            }
        ]
        self.write_jsonl(data)
        main_usage, subagent_usage = analyze_token_usage.analyze_main_session(self.test_file)

        self.assertEqual(main_usage['messages'], 0)
        self.assertEqual(len(subagent_usage), 2)

        agent_123 = subagent_usage['agent-123']
        self.assertEqual(agent_123['messages'], 2)
        self.assertEqual(agent_123['input_tokens'], 200)
        self.assertEqual(agent_123['output_tokens'], 100)
        self.assertEqual(agent_123['cache_creation'], 20)
        self.assertEqual(agent_123['cache_read'], 0)
        self.assertEqual(agent_123['description'], "a helpful assistant.")

        agent_456 = subagent_usage['agent-456']
        self.assertEqual(agent_456['messages'], 1)
        self.assertEqual(agent_456['input_tokens'], 300)
        self.assertEqual(agent_456['description'], "Test agent 2.")

    def test_analyze_main_session_mixed_and_invalid(self):
        # Write some valid JSON, some invalid JSON, and some JSON without the expected fields
        with open(self.test_file, 'w') as f:
            f.write(json.dumps({
                "type": "assistant",
                "message": {
                    "usage": {
                        "input_tokens": 10
                    }
                }
            }) + '\n')
            f.write("invalid json\n")
            f.write(json.dumps({"type": "other"}) + '\n')
            f.write(json.dumps({
                "type": "user",
                "toolUseResult": {
                    "agentId": "agent-1"
                    # missing usage
                }
            }) + '\n')

        main_usage, subagent_usage = analyze_token_usage.analyze_main_session(self.test_file)
        self.assertEqual(main_usage['messages'], 1)
        self.assertEqual(main_usage['input_tokens'], 10)
        self.assertEqual(len(subagent_usage), 0)

if __name__ == '__main__':
    unittest.main()
