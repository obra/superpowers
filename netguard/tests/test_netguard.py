"""Testes das funcoes puras do NetGuard.

Corre com:  python3 -m unittest discover -s netguard/tests -t .
"""

import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import netguard  # noqa: E402

ROUTER = "a4:2b:b0:11:22:33"
PHONE = "3c:5a:b4:aa:bb:cc"
DESKTOP = "d8:cb:8a:44:55:66"
INTRUDER = "f0:18:98:77:88:99"

CONFIG = {
    "authorized": [
        {"name": "Router TP-Link", "mac": ROUTER, "role": "router", "required": True},
        {"name": "Xiaomi 14T Pro", "mac": PHONE, "role": "telemovel"},
        {"name": "Asus K550C", "mac": DESKTOP, "role": "desktop"},
    ],
    "router": {"allowed_ports": [80, 443]},
}

NOW = "2026-07-25T09:00:00"


def kinds(events):
    return [e["kind"] for e in events]


class TestMac(unittest.TestCase):
    def test_normalizes_case_and_separator(self):
        self.assertEqual(netguard.normalize_mac("A4-2B-B0-11-22-33"), ROUTER)
        self.assertEqual(netguard.normalize_mac("  a4:2b:b0:11:22:33 "), ROUTER)

    def test_rejects_invalid_and_placeholder(self):
        for value in (None, "", "PREENCHER", "a4:2b:b0:11:22",
                      "00:00:00:00:00:00", "ff:ff:ff:ff:ff:ff", "zz:2b:b0:11:22:33"):
            self.assertIsNone(netguard.normalize_mac(value), value)


class TestArpParsers(unittest.TestCase):
    def test_ip_neigh(self):
        out = (
            "192.168.0.1 dev wlan0 lladdr a4:2b:b0:11:22:33 REACHABLE\n"
            "192.168.0.14 dev wlan0 lladdr 3c:5a:b4:aa:bb:cc STALE\n"
            "192.168.0.99 dev wlan0  FAILED\n"
            "fe80::1 dev wlan0 lladdr a4:2b:b0:11:22:33 router REACHABLE\n"
        )
        self.assertEqual(netguard.parse_ip_neigh(out),
                         {"192.168.0.1": ROUTER, "192.168.0.14": PHONE})

    def test_arp_linux(self):
        out = (
            "? (192.168.0.1) at a4:2b:b0:11:22:33 [ether] on wlan0\n"
            "? (192.168.0.14) at 3c:5a:b4:aa:bb:cc [ether] on wlan0\n"
            "? (192.168.0.77) at <incomplete> on wlan0\n"
        )
        self.assertEqual(netguard.parse_arp_output(out),
                         {"192.168.0.1": ROUTER, "192.168.0.14": PHONE})

    def test_arp_windows(self):
        out = (
            "Interface: 192.168.0.20 --- 0x5\n"
            "  Internet Address      Physical Address      Type\n"
            "  192.168.0.1           a4-2b-b0-11-22-33     dynamic\n"
            "  192.168.0.255         ff-ff-ff-ff-ff-ff     static\n"
        )
        self.assertEqual(netguard.parse_arp_output(out), {"192.168.0.1": ROUTER})

    def test_proc_net_arp(self):
        out = (
            "IP address       HW type  Flags  HW address            Mask  Device\n"
            "192.168.0.1      0x1      0x2    a4:2b:b0:11:22:33     *     wlan0\n"
            "192.168.0.50     0x1      0x0    00:00:00:00:00:00     *     wlan0\n"
        )
        self.assertEqual(netguard.parse_proc_net_arp(out), {"192.168.0.1": ROUTER})


class TestSyslog(unittest.TestCase):
    def test_login_failure_is_critical(self):
        result = netguard.parse_syslog_line(
            "Jul 25 09:12:01 Web: Login failed from 192.168.0.60")
        self.assertEqual(result[0], "critical")

    def test_config_change_is_warning(self):
        result = netguard.parse_syslog_line("Jul 25 09:13:00 System: admin logged in")
        self.assertEqual(result[0], "warning")

    def test_routine_line_ignored(self):
        self.assertIsNone(netguard.parse_syslog_line(
            "Jul 25 09:14:00 DHCPS: send OFFER to 192.168.0.14"))


class TestAnalyse(unittest.TestCase):
    def scan(self, hosts, gateway="192.168.0.1", degraded=False):
        return {"hosts": hosts, "gateway": gateway, "degraded": degraded}

    def test_clean_network_produces_no_events(self):
        scan = self.scan({
            "192.168.0.1": {"mac": ROUTER, "ports": [80]},
            "192.168.0.14": {"mac": PHONE, "ports": []},
            "192.168.0.20": {"mac": DESKTOP, "ports": []},
        })
        events, state = netguard.analyse(scan, CONFIG, {}, NOW)
        self.assertEqual(events, [])
        self.assertEqual(state["gateway_mac"], ROUTER)
        self.assertEqual(state["known_ips"][PHONE], "192.168.0.14")

    def test_unknown_device_is_critical(self):
        scan = self.scan({
            "192.168.0.1": {"mac": ROUTER, "ports": [80]},
            "192.168.0.60": {"mac": INTRUDER, "ports": [445]},
        })
        events, _ = netguard.analyse(scan, CONFIG, {}, NOW)
        self.assertIn("unauthorized_device", kinds(events))
        event = [e for e in events if e["kind"] == "unauthorized_device"][0]
        self.assertEqual(event["severity"], "critical")
        self.assertEqual(event["mac"], INTRUDER)

    def test_gateway_mac_change_detected(self):
        scan = self.scan({"192.168.0.1": {"mac": INTRUDER, "ports": [80]}})
        events, _ = netguard.analyse(scan, CONFIG, {"gateway_mac": ROUTER}, NOW)
        changed = [e for e in events if e["kind"] == "gateway_mac_changed"]
        self.assertEqual(len(changed), 1)
        self.assertEqual(changed[0]["previous_mac"], ROUTER)

    def test_first_run_does_not_flag_gateway_change(self):
        scan = self.scan({"192.168.0.1": {"mac": ROUTER, "ports": [80]}})
        events, _ = netguard.analyse(scan, CONFIG, {}, NOW)
        self.assertNotIn("gateway_mac_changed", kinds(events))

    def test_router_unreachable(self):
        scan = self.scan({"192.168.0.14": {"mac": PHONE, "ports": []}})
        events, _ = netguard.analyse(scan, CONFIG, {}, NOW)
        self.assertIn("router_unreachable", kinds(events))

    def test_unexpected_router_port(self):
        scan = self.scan({"192.168.0.1": {"mac": ROUTER, "ports": [80, 23]}})
        events, _ = netguard.analyse(scan, CONFIG, {}, NOW)
        port_events = [e for e in events if e["kind"] == "router_port_unexpected"]
        self.assertEqual(port_events[0]["ports"], [23])

    def test_duplicate_mac_flagged(self):
        scan = self.scan({
            "192.168.0.1": {"mac": ROUTER, "ports": [80]},
            "192.168.0.14": {"mac": PHONE, "ports": []},
            "192.168.0.15": {"mac": PHONE, "ports": []},
        })
        events, _ = netguard.analyse(scan, CONFIG, {}, NOW)
        dup = [e for e in events if e["kind"] == "duplicate_mac"]
        self.assertEqual(dup[0]["ips"], ["192.168.0.14", "192.168.0.15"])

    def test_expected_ip_mismatch(self):
        config = dict(CONFIG)
        config["authorized"] = [
            {"name": "Router TP-Link", "mac": ROUTER, "role": "router"},
            {"name": "Xiaomi 14T Pro", "mac": PHONE, "expected_ip": "192.168.0.14"},
        ]
        scan = self.scan({
            "192.168.0.1": {"mac": ROUTER, "ports": [80]},
            "192.168.0.31": {"mac": PHONE, "ports": []},
        })
        events, _ = netguard.analyse(scan, config, {}, NOW)
        self.assertIn("device_ip_mismatch", kinds(events))

    def test_ip_change_is_only_info(self):
        scan = self.scan({
            "192.168.0.1": {"mac": ROUTER, "ports": [80]},
            "192.168.0.31": {"mac": PHONE, "ports": []},
        })
        state = {"gateway_mac": ROUTER, "known_ips": {PHONE: "192.168.0.14"}}
        events, _ = netguard.analyse(scan, CONFIG, state, NOW)
        self.assertEqual([e["severity"] for e in events], ["info"])

    def test_required_device_missing(self):
        scan = self.scan({"192.168.0.14": {"mac": PHONE, "ports": []}}, gateway=None)
        events, _ = netguard.analyse(scan, CONFIG, {}, NOW)
        missing = [e for e in events if e["kind"] == "device_missing"]
        self.assertEqual(missing[0]["name"], "Router TP-Link")

    def test_degraded_mode_falls_back_to_ip(self):
        config = {
            "authorized": [{"name": "Xiaomi", "mac": PHONE, "expected_ip": "192.168.0.14"}],
            "router": {"allowed_ports": [80]},
        }
        scan = self.scan({
            "192.168.0.1": {"mac": None, "ports": [80]},
            "192.168.0.14": {"mac": None, "ports": []},
            "192.168.0.60": {"mac": None, "ports": [445]},
        }, degraded=True)
        events, _ = netguard.analyse(scan, config, {}, NOW)
        self.assertIn("degraded_scan", kinds(events))
        unknown = [e for e in events if e["kind"] == "unknown_ip"]
        self.assertEqual([e["ip"] for e in unknown], ["192.168.0.60"])

    def test_analyse_does_not_mutate_inputs(self):
        state = {"gateway_mac": ROUTER, "known_ips": {PHONE: "192.168.0.14"}}
        snapshot = {"gateway_mac": ROUTER, "known_ips": {PHONE: "192.168.0.14"}}
        scan = self.scan({
            "192.168.0.1": {"mac": ROUTER, "ports": [80]},
            "192.168.0.31": {"mac": PHONE, "ports": []},
        })
        netguard.analyse(scan, CONFIG, state, NOW)
        self.assertEqual(state, snapshot)


class TestPersona(unittest.TestCase):
    def config(self, persona):
        config = dict(CONFIG)
        config["persona"] = persona
        return config

    def test_defaults_to_netguard_without_persona(self):
        self.assertEqual(netguard.persona_name(CONFIG), "NetGuard")
        self.assertFalse(netguard.persona_speaks(CONFIG))

    def test_named_persona_signs_the_report(self):
        config = self.config({"name": "Francisco"})
        text = netguard.render_report("2026-07-25", [], {}, config)
        self.assertIn("# Francisco — relatorio de 2026-07-25", text)
        self.assertIn("Sou o Francisco", text)
        self.assertIn("— Francisco, de vigia.", text)

    def test_voice_can_be_turned_off_keeping_the_name(self):
        config = self.config({"name": "Francisco", "voice": False})
        text = netguard.render_report("2026-07-25", [], {}, config)
        self.assertIn("# Francisco — relatorio", text)
        self.assertNotIn("Sou o Francisco", text)

    def test_greeting_matches_the_day(self):
        clean = netguard.persona_greeting("Francisco", {"critical": 0, "warning": 0})
        warn = netguard.persona_greeting("Francisco", {"critical": 0, "warning": 2})
        bad = netguard.persona_greeting("Francisco", {"critical": 1, "warning": 0})
        self.assertIn("nao vi nada fora do sitio", clean)
        self.assertIn("2 ponto(s)", warn)
        self.assertIn("1 ocorrencia(s) grave(s)", bad)
        for line in (clean, warn, bad):
            self.assertTrue(line.startswith("Sou o Francisco."), line)

    def test_empty_name_falls_back_and_stays_silent(self):
        config = self.config({"name": "", "voice": True})
        self.assertEqual(netguard.persona_name(config), "NetGuard")
        self.assertFalse(netguard.persona_speaks(config))


class TestReport(unittest.TestCase):
    def test_clean_day_says_no_incidents(self):
        text = netguard.render_report("2026-07-25", [], {"known_ips": {}}, CONFIG)
        self.assertIn("Sem incidentes", text)
        self.assertIn("Xiaomi 14T Pro", text)

    def test_critical_day_leads_with_alert(self):
        events = [{"time": NOW, "severity": "critical", "kind": "unauthorized_device",
                   "message": "Dispositivo nao autorizado"}]
        text = netguard.render_report("2026-07-25", events, {}, CONFIG)
        self.assertIn("ALERTA: 1 evento", text)
        self.assertIn("unauthorized_device", text)

    def test_summarize_counts(self):
        events = [{"severity": "critical", "kind": "a"},
                  {"severity": "critical", "kind": "a"},
                  {"severity": "info", "kind": "b"}]
        counts, by_kind = netguard.summarize(events)
        self.assertEqual(counts["critical"], 2)
        self.assertEqual(by_kind, {"a": 2, "b": 1})


class TestPersistence(unittest.TestCase):
    def test_events_roundtrip_and_day_filter(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "events.jsonl")
            netguard.append_events(path, [
                {"time": "2026-07-24T10:00:00", "severity": "info",
                 "kind": "x", "message": "ontem"},
                {"time": "2026-07-25T10:00:00", "severity": "info",
                 "kind": "x", "message": "hoje"},
            ])
            self.assertEqual(len(netguard.read_events(path)), 2)
            today = netguard.read_events(path, "2026-07-25")
            self.assertEqual([e["message"] for e in today], ["hoje"])

    def test_prune_keeps_recent_reports(self):
        import datetime as dt
        with tempfile.TemporaryDirectory() as tmp:
            recent = dt.date.today().isoformat()
            old = (dt.date.today() - dt.timedelta(days=200)).isoformat()
            for day in (recent, old):
                open(os.path.join(tmp, "netguard-%s.md" % day), "w").close()
            open(os.path.join(tmp, "notas.md"), "w").close()
            netguard.prune_reports(tmp, 90)
            remaining = sorted(os.listdir(tmp))
            self.assertIn("netguard-%s.md" % recent, remaining)
            self.assertNotIn("netguard-%s.md" % old, remaining)
            self.assertIn("notas.md", remaining)


if __name__ == "__main__":
    unittest.main()
