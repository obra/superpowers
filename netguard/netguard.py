#!/usr/bin/env python3
"""NetGuard — vigia de rede local para o router TP-Link.

Deteta dispositivos nao autorizados na LAN, mudancas de MAC da gateway
(sinal classico de ARP spoofing / MITM), portas inesperadas abertas no
router e eventos de log enviados pelo router por syslog.

Sem dependencias externas: so a biblioteca padrao do Python 3.8+.

Comandos:
    learn     regista os dispositivos atualmente na rede como autorizados
    scan      faz uma varredura, grava eventos e dispara alertas
    report    gera o relatorio Markdown de um dia
    watch     corre scan em ciclo (alternativa ao cron)
    syslog    recebe syslog do router em UDP e grava eventos
    status    mostra o estado atual conhecido
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import ipaddress
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG = os.path.join(BASE_DIR, "config.json")

SEVERITY_ORDER = {"info": 0, "warning": 1, "critical": 2}

# ---------------------------------------------------------------------------
# Utilidades puras (cobertas por tests/test_netguard.py)
# ---------------------------------------------------------------------------

MAC_RE = re.compile(r"([0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5})")


def normalize_mac(mac):
    """Devolve o MAC em minusculas com ':' ou None se nao for valido."""
    if not mac:
        return None
    mac = mac.strip().lower().replace("-", ":")
    if not MAC_RE.fullmatch(mac):
        return None
    if mac in ("00:00:00:00:00:00", "ff:ff:ff:ff:ff:ff"):
        return None
    return mac


def parse_ip_neigh(output):
    """Parse do output de `ip neigh show`. Devolve {ip: mac}."""
    table = {}
    for line in output.splitlines():
        parts = line.split()
        if not parts:
            continue
        ip = parts[0]
        if "FAILED" in line or "INCOMPLETE" in line:
            continue
        mac = None
        for i, tok in enumerate(parts):
            if tok == "lladdr" and i + 1 < len(parts):
                mac = normalize_mac(parts[i + 1])
        if mac and _is_ipv4(ip):
            table[ip] = mac
    return table


def parse_arp_output(output):
    """Parse do output de `arp -an` (Linux/macOS/Windows). Devolve {ip: mac}."""
    table = {}
    for line in output.splitlines():
        ips = re.findall(r"\d{1,3}(?:\.\d{1,3}){3}", line)
        macs = MAC_RE.findall(line.replace("-", ":"))
        if not ips or not macs:
            continue
        mac = normalize_mac(macs[0])
        if mac and _is_ipv4(ips[0]):
            table[ips[0]] = mac
    return table


def parse_proc_net_arp(output):
    """Parse de /proc/net/arp. Devolve {ip: mac}."""
    table = {}
    for line in output.splitlines()[1:]:
        parts = line.split()
        if len(parts) < 4:
            continue
        mac = normalize_mac(parts[3])
        if mac and _is_ipv4(parts[0]):
            table[parts[0]] = mac
    return table


def _is_ipv4(value):
    try:
        ipaddress.IPv4Address(value)
        return True
    except ValueError:
        return False


def parse_syslog_line(line):
    """Classifica uma linha de syslog do router.

    Devolve (severity, kind) ou None se a linha nao interessa.
    Os padroes sao genericos: o texto exato varia com o modelo/firmware
    TP-Link, por isso ha tambem uma categoria 'suspeito' abrangente.
    """
    low = line.lower()
    critical_markers = (
        "login failed",
        "failed to login",
        "authentication failed",
        "wrong password",
        "incorrect password",
        "unauthorized",
        "intrusion",
        "attack",
        "dos ",
        "flood",
        "port scan",
        "brute",
    )
    warning_markers = (
        "login",
        "admin",
        "firmware",
        "upgrade",
        "reset",
        "config changed",
        "settings changed",
        "wps",
        "denied",
        "dropped",
    )
    for marker in critical_markers:
        if marker in low:
            return ("critical", marker.strip())
    for marker in warning_markers:
        if marker in low:
            return ("warning", marker.strip())
    return None


def analyse(scan, config, state, now_iso):
    """Compara a varredura com a lista de autorizados e o estado anterior.

    scan  -- {"hosts": {ip: {"mac": str|None, "ports": [int]}},
              "gateway": ip|None, "degraded": bool}
    Devolve (events, new_state). Funcao pura: nao toca em I/O.
    """
    events = []
    authorized = {}
    for entry in config.get("authorized", []):
        mac = normalize_mac(entry.get("mac"))
        if mac:
            authorized[mac] = entry

    hosts = scan.get("hosts", {})
    gateway = scan.get("gateway")
    prev = state.get("gateway_mac")
    seen_macs = {}

    def add(severity, kind, message, **extra):
        event = {"time": now_iso, "severity": severity, "kind": kind, "message": message}
        event.update(extra)
        events.append(event)

    if scan.get("degraded"):
        add(
            "warning",
            "degraded_scan",
            "Sem acesso a tabela ARP: dispositivos identificados apenas por IP. "
            "A delecao de MAC clonado nao esta disponivel neste equipamento.",
        )

    # --- Router / gateway ---------------------------------------------------
    if gateway:
        gw_host = hosts.get(gateway)
        if gw_host is None:
            add("critical", "router_unreachable",
                "Router %s nao respondeu a varredura." % gateway, ip=gateway)
        else:
            gw_mac = gw_host.get("mac")
            if gw_mac:
                if prev and gw_mac != prev:
                    add("critical", "gateway_mac_changed",
                        "O MAC do router mudou de %s para %s. Possivel ARP spoofing "
                        "ou router substituido." % (prev, gw_mac),
                        ip=gateway, mac=gw_mac, previous_mac=prev)
                state = dict(state)
                state["gateway_mac"] = gw_mac
            allowed_ports = set(config.get("router", {}).get("allowed_ports", []))
            unexpected = sorted(p for p in gw_host.get("ports", []) if p not in allowed_ports)
            if unexpected:
                add("critical", "router_port_unexpected",
                    "Portas inesperadas abertas no router %s: %s" %
                    (gateway, ", ".join(str(p) for p in unexpected)),
                    ip=gateway, ports=unexpected)

    # --- Dispositivos -------------------------------------------------------
    known_ips = dict(state.get("known_ips", {}))
    for ip in sorted(hosts, key=lambda a: tuple(int(x) for x in a.split("."))):
        info = hosts[ip]
        mac = info.get("mac")
        if mac:
            seen_macs.setdefault(mac, []).append(ip)
            entry = authorized.get(mac)
            if entry is None:
                add("critical", "unauthorized_device",
                    "Dispositivo nao autorizado na rede: %s (MAC %s)." % (ip, mac),
                    ip=ip, mac=mac, ports=info.get("ports", []))
                continue
            expected_ip = entry.get("expected_ip")
            if expected_ip and expected_ip != ip:
                add("warning", "device_ip_mismatch",
                    "%s esta em %s mas o IP fixo esperado e %s." %
                    (entry.get("name", mac), ip, expected_ip),
                    ip=ip, mac=mac, name=entry.get("name"))
            elif known_ips.get(mac) and known_ips[mac] != ip:
                add("info", "device_ip_changed",
                    "%s mudou de %s para %s." % (entry.get("name", mac), known_ips[mac], ip),
                    ip=ip, mac=mac, name=entry.get("name"))
            known_ips[mac] = ip
        else:
            # Sem MAC: so podemos comparar por IP.
            allowed_ips = {e.get("expected_ip") for e in config.get("authorized", [])}
            allowed_ips.discard(None)
            if ip not in allowed_ips and ip != gateway:
                add("warning", "unknown_ip",
                    "IP ativo sem identificacao de MAC e fora da lista: %s." % ip,
                    ip=ip, ports=info.get("ports", []))

    for mac, ips in seen_macs.items():
        if len(ips) > 1:
            add("critical", "duplicate_mac",
                "O MAC %s aparece em varios IP (%s). Sinal de clonagem/spoofing." %
                (mac, ", ".join(ips)), mac=mac, ips=ips)

    # --- Dispositivos autorizados ausentes ----------------------------------
    present = set(seen_macs)
    for mac, entry in authorized.items():
        if entry.get("required") and mac not in present:
            add("warning", "device_missing",
                "Dispositivo autorizado ausente da rede: %s." % entry.get("name", mac),
                mac=mac, name=entry.get("name"))

    new_state = dict(state)
    new_state["known_ips"] = known_ips
    new_state["last_scan"] = now_iso
    new_state["last_hosts"] = hosts
    return events, new_state


def summarize(events):
    """Agrega eventos por severidade e tipo, para o relatorio."""
    counts = {"critical": 0, "warning": 0, "info": 0}
    kinds = {}
    for event in events:
        sev = event.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1
        kinds[event.get("kind", "?")] = kinds.get(event.get("kind", "?"), 0) + 1
    return counts, kinds


def render_report(day, events, state, config):
    """Constroi o relatorio diario em Markdown."""
    counts, kinds = summarize(events)
    lines = []
    lines.append("# Relatorio NetGuard — %s" % day)
    lines.append("")
    if counts["critical"]:
        veredito = "ALERTA: %d evento(s) critico(s)" % counts["critical"]
    elif counts["warning"]:
        veredito = "Atencao: %d aviso(s)" % counts["warning"]
    else:
        veredito = "Sem incidentes"
    lines.append("**Veredito:** %s" % veredito)
    lines.append("")
    lines.append("| Severidade | Eventos |")
    lines.append("| --- | --- |")
    for sev in ("critical", "warning", "info"):
        lines.append("| %s | %d |" % (sev, counts.get(sev, 0)))
    lines.append("")

    lines.append("## Dispositivos autorizados")
    lines.append("")
    lines.append("| Nome | MAC | IP atual |")
    lines.append("| --- | --- | --- |")
    known = state.get("known_ips", {})
    for entry in config.get("authorized", []):
        mac = normalize_mac(entry.get("mac")) or entry.get("mac", "?")
        lines.append("| %s | %s | %s |" %
                     (entry.get("name", "?"), mac, known.get(mac, "nao visto")))
    lines.append("")

    if kinds:
        lines.append("## Ocorrencias por tipo")
        lines.append("")
        for kind, count in sorted(kinds.items(), key=lambda kv: -kv[1]):
            lines.append("- `%s`: %d" % (kind, count))
        lines.append("")

    lines.append("## Cronologia")
    lines.append("")
    if not events:
        lines.append("Nenhum evento registado neste dia.")
    else:
        for event in events:
            lines.append("- **%s** `%s` — %s" %
                         (event.get("time", "?")[11:19], event.get("severity", "?"),
                          event.get("message", "")))
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("Ultima varredura: %s" % state.get("last_scan", "nunca"))
    lines.append("MAC do router memorizado: %s" % state.get("gateway_mac", "desconhecido"))
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Camada de I/O: descoberta de rede
# ---------------------------------------------------------------------------

def run(cmd, timeout=15):
    """Corre um comando e devolve stdout, ou '' se falhar/nao existir."""
    if shutil.which(cmd[0]) is None:
        return ""
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return out.stdout or ""
    except (subprocess.SubprocessError, OSError):
        return ""


def arp_table():
    """Tabela ARP a partir da primeira fonte disponivel. {} se nenhuma."""
    out = run(["ip", "neigh", "show"])
    if out.strip():
        table = parse_ip_neigh(out)
        if table:
            return table
    out = run(["arp", "-an"])
    if not out.strip():
        out = run(["arp", "-a"])
    if out.strip():
        table = parse_arp_output(out)
        if table:
            return table
    try:
        with open("/proc/net/arp", "r") as handle:
            return parse_proc_net_arp(handle.read())
    except OSError:
        return {}


def detect_gateway():
    """IP da gateway (router), ou None."""
    out = run(["ip", "route", "show", "default"])
    match = re.search(r"default via (\d{1,3}(?:\.\d{1,3}){3})", out)
    if match:
        return match.group(1)
    out = run(["route", "-n"])
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[0] == "0.0.0.0" and _is_ipv4(parts[1]):
            return parts[1]
    return None


def local_ipv4():
    """IP local desta maquina, via socket UDP sem trafego real."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("192.0.2.1", 9))  # TEST-NET-1, nao encaminhado
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


def detect_cidr():
    """Prefixo da rede local, p.ex. '192.168.0.0/24'."""
    out = run(["ip", "-4", "-o", "addr", "show", "scope", "global"])
    for line in out.splitlines():
        match = re.search(r"inet (\d{1,3}(?:\.\d{1,3}){3}/\d{1,2})", line)
        if match:
            return str(ipaddress.ip_network(match.group(1), strict=False))
    ip = local_ipv4()
    if ip:
        return str(ipaddress.ip_network(ip + "/24", strict=False))
    return None


def ping(host, timeout_ms):
    """True se o host responder a ICMP."""
    if platform.system().lower().startswith("win"):
        cmd = ["ping", "-n", "1", "-w", str(timeout_ms), host]
    else:
        cmd = ["ping", "-c", "1", "-W", str(max(1, timeout_ms // 1000)), host]
    if shutil.which(cmd[0]) is None:
        return False
    try:
        return subprocess.run(cmd, capture_output=True,
                              timeout=max(2, timeout_ms / 1000 + 1)).returncode == 0
    except (subprocess.SubprocessError, OSError):
        return False


def tcp_open(host, port, timeout):
    """True se a porta TCP aceitar ligacao."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        return sock.connect_ex((host, port)) == 0
    except OSError:
        return False
    finally:
        sock.close()


def probe_host(host, timeout_ms, probe_ports):
    """Descobre se o host esta vivo e que portas responde."""
    timeout = max(0.2, timeout_ms / 1000.0)
    ports = [p for p in probe_ports if tcp_open(host, p, timeout)]
    alive = bool(ports) or ping(host, timeout_ms)
    return alive, ports


def scan_network(config):
    """Varre a rede e devolve a estrutura consumida por analyse()."""
    net_cfg = config.get("network", {})
    cidr = net_cfg.get("cidr")
    if not cidr or cidr == "auto":
        cidr = detect_cidr()
    if not cidr:
        raise RuntimeError("Nao foi possivel determinar a rede local. "
                           "Define network.cidr no config.json (ex: 192.168.0.0/24).")

    gateway = net_cfg.get("gateway")
    if not gateway or gateway == "auto":
        gateway = detect_gateway()

    scan_cfg = config.get("scan", {})
    timeout_ms = int(scan_cfg.get("timeout_ms", 800))
    workers = int(scan_cfg.get("workers", 64))
    probe_ports = list(scan_cfg.get("extra_probe_ports", [80, 443, 22, 445, 62078, 5555]))

    network = ipaddress.ip_network(cidr, strict=False)
    targets = [str(h) for h in network.hosts()]
    if len(targets) > 1024:
        raise RuntimeError("Rede demasiado grande (%d enderecos). Usa um /24." % len(targets))

    hosts = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(probe_host, ip, timeout_ms, probe_ports): ip for ip in targets}
        for future in concurrent.futures.as_completed(futures):
            ip = futures[future]
            try:
                alive, ports = future.result()
            except Exception:
                continue
            if alive:
                hosts[ip] = {"mac": None, "ports": ports}

    # A tabela ARP so fica preenchida depois do trafego acima.
    table = arp_table()
    for ip, mac in table.items():
        if ip in hosts:
            hosts[ip]["mac"] = mac
        elif ipaddress.ip_address(ip) in network:
            hosts[ip] = {"mac": mac, "ports": []}

    if gateway and gateway not in hosts:
        alive, ports = probe_host(gateway, timeout_ms,
                                  config.get("router", {}).get("watch_ports", probe_ports))
        if alive:
            hosts[gateway] = {"mac": arp_table().get(gateway), "ports": ports}

    if gateway in hosts:
        watch = config.get("router", {}).get("watch_ports", [])
        timeout = max(0.2, timeout_ms / 1000.0)
        extra = [p for p in watch if p not in hosts[gateway]["ports"]
                 and tcp_open(gateway, p, timeout)]
        hosts[gateway]["ports"] = sorted(set(hosts[gateway]["ports"]) | set(extra))

    return {"hosts": hosts, "gateway": gateway, "cidr": cidr, "degraded": not table}


# ---------------------------------------------------------------------------
# Persistencia
# ---------------------------------------------------------------------------

def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return default


def save_json(path, data):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


def paths_for(config, config_path):
    root = config.get("data_dir")
    if not root:
        root = os.path.dirname(os.path.abspath(config_path))
    return {
        "state": os.path.join(root, "state.json"),
        "events": os.path.join(root, "events.jsonl"),
        "reports": os.path.join(root, config.get("report", {}).get("dir", "reports")),
    }


def append_events(path, events):
    if not events:
        return
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "a", encoding="utf-8") as handle:
        for event in events:
            handle.write(json.dumps(event, ensure_ascii=False) + "\n")


def read_events(path, day=None):
    events = []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except ValueError:
                    continue
                if day and not str(event.get("time", "")).startswith(day):
                    continue
                events.append(event)
    except OSError:
        pass
    return events


def notify(config, events):
    """Dispara o comando de alerta configurado para eventos relevantes."""
    alerts = config.get("alerts", {})
    command = alerts.get("command")
    if not command:
        return
    floor = SEVERITY_ORDER.get(alerts.get("min_severity", "warning"), 1)
    relevant = [e for e in events if SEVERITY_ORDER.get(e.get("severity"), 0) >= floor]
    if not relevant:
        return
    text = "NetGuard: %d evento(s)\n%s" % (
        len(relevant),
        "\n".join("[%s] %s" % (e["severity"], e["message"]) for e in relevant[:10]),
    )
    try:
        subprocess.run(command, shell=True, input=text, text=True, timeout=30,
                       env=dict(os.environ, NETGUARD_MESSAGE=text))
    except (subprocess.SubprocessError, OSError) as exc:
        print("Aviso: comando de alerta falhou: %s" % exc, file=sys.stderr)


# ---------------------------------------------------------------------------
# Comandos
# ---------------------------------------------------------------------------

def now_iso():
    return dt.datetime.now().replace(microsecond=0).isoformat()


def load_config(path):
    if not os.path.exists(path):
        raise SystemExit(
            "Config nao encontrado: %s\nCopia config.example.json para config.json "
            "e corre `python3 netguard.py learn`." % path)
    config = load_json(path, None)
    if config is None:
        raise SystemExit("config.json invalido (JSON malformado): %s" % path)
    return config


def cmd_learn(args):
    config = load_config(args.config)
    scan = scan_network(config)
    existing = {normalize_mac(e.get("mac")) for e in config.get("authorized", [])}
    added = 0
    for ip, info in sorted(scan["hosts"].items()):
        mac = info.get("mac")
        if not mac or mac in existing:
            continue
        role = "router" if ip == scan.get("gateway") else "desconhecido"
        config.setdefault("authorized", []).append({
            "name": "%s (%s)" % (role, ip),
            "mac": mac,
            "role": role,
            "expected_ip": ip if role == "router" else None,
        })
        existing.add(mac)
        added += 1
        print("+ %s  %s  (%s)" % (mac, ip, role))
    if scan["degraded"]:
        print("AVISO: sem tabela ARP acessivel — nenhum MAC pode ser aprendido "
              "neste equipamento. Corre o learn no desktop.", file=sys.stderr)
    save_json(args.config, config)
    print("\n%d dispositivo(s) adicionado(s) a %s." % (added, args.config))
    print("Edita o ficheiro e poe nomes reais; apaga o que nao reconheceres.")
    return 0


def cmd_scan(args):
    config = load_config(args.config)
    paths = paths_for(config, args.config)
    state = load_json(paths["state"], {})
    scan = scan_network(config)
    events, new_state = analyse(scan, config, state, now_iso())
    save_json(paths["state"], new_state)
    append_events(paths["events"], events)
    notify(config, events)

    counts, _ = summarize(events)
    print("Rede %s — %d host(s) ativo(s), gateway %s" %
          (scan["cidr"], len(scan["hosts"]), scan.get("gateway") or "?"))
    for event in events:
        print("[%s] %s" % (event["severity"].upper(), event["message"]))
    if not events:
        print("Sem eventos: tudo conforme a lista de autorizados.")
    return 2 if counts["critical"] else 0


def cmd_report(args):
    config = load_config(args.config)
    paths = paths_for(config, args.config)
    day = args.day or dt.date.today().isoformat()
    if day == "yesterday":
        day = (dt.date.today() - dt.timedelta(days=1)).isoformat()
    events = read_events(paths["events"], day)
    state = load_json(paths["state"], {})
    text = render_report(day, events, state, config)
    os.makedirs(paths["reports"], exist_ok=True)
    out = os.path.join(paths["reports"], "netguard-%s.md" % day)
    with open(out, "w", encoding="utf-8") as handle:
        handle.write(text)
    prune_reports(paths["reports"], int(config.get("report", {}).get("keep_days", 90)))
    if args.stdout:
        print(text)
    else:
        print("Relatorio escrito em %s" % out)
    return 0


def prune_reports(directory, keep_days):
    if keep_days <= 0:
        return
    cutoff = dt.date.today() - dt.timedelta(days=keep_days)
    try:
        names = os.listdir(directory)
    except OSError:
        return
    for name in names:
        match = re.fullmatch(r"netguard-(\d{4}-\d{2}-\d{2})\.md", name)
        if not match:
            continue
        try:
            day = dt.date.fromisoformat(match.group(1))
        except ValueError:
            continue
        if day < cutoff:
            try:
                os.remove(os.path.join(directory, name))
            except OSError:
                pass


def cmd_watch(args):
    config = load_config(args.config)
    interval = int(args.interval or config.get("scan", {}).get("interval_minutes", 10)) * 60
    report_hour = config.get("report", {}).get("daily_hour", 8)
    last_report = None
    print("watch: varredura a cada %d min; relatorio diario as %02d:00. Ctrl-C para sair."
          % (interval // 60, report_hour))
    while True:
        try:
            cmd_scan(args)
            today = dt.date.today().isoformat()
            if dt.datetime.now().hour >= report_hour and last_report != today:
                args.day, args.stdout = today, False
                cmd_report(args)
                last_report = today
        except KeyboardInterrupt:
            return 0
        except Exception as exc:  # o ciclo nao pode morrer por um erro pontual
            print("Erro na varredura: %s" % exc, file=sys.stderr)
        try:
            time.sleep(interval)
        except KeyboardInterrupt:
            return 0


def cmd_syslog(args):
    """Recebe syslog UDP do router e grava as linhas relevantes como eventos."""
    config = load_config(args.config)
    paths = paths_for(config, args.config)
    port = int(args.port or config.get("syslog", {}).get("port", 1514))
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("0.0.0.0", port))
    print("A escutar syslog em UDP 0.0.0.0:%d (Ctrl-C para sair)." % port)
    router_ip = config.get("router", {}).get("ip")
    while True:
        try:
            data, addr = sock.recvfrom(4096)
        except KeyboardInterrupt:
            sock.close()
            return 0
        line = data.decode("utf-8", "replace").strip()
        if router_ip and router_ip not in ("auto", addr[0]):
            continue
        verdict = parse_syslog_line(line)
        if not verdict:
            continue
        severity, kind = verdict
        event = {
            "time": now_iso(),
            "severity": severity,
            "kind": "syslog_" + re.sub(r"\W+", "_", kind).strip("_"),
            "message": "Router %s: %s" % (addr[0], line),
            "source": addr[0],
        }
        append_events(paths["events"], [event])
        notify(config, [event])
        print("[%s] %s" % (severity.upper(), line))


def cmd_status(args):
    config = load_config(args.config)
    paths = paths_for(config, args.config)
    state = load_json(paths["state"], {})
    print("Ultima varredura: %s" % state.get("last_scan", "nunca"))
    print("MAC do router:    %s" % state.get("gateway_mac", "desconhecido"))
    print("\nAutorizados:")
    known = state.get("known_ips", {})
    for entry in config.get("authorized", []):
        mac = normalize_mac(entry.get("mac")) or "?"
        print("  %-28s %s  %s" % (entry.get("name", "?"), mac, known.get(mac, "-")))
    events = read_events(paths["events"], dt.date.today().isoformat())
    counts, _ = summarize(events)
    print("\nHoje: %d critico(s), %d aviso(s), %d info." %
          (counts["critical"], counts["warning"], counts["info"]))
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description="NetGuard — vigia da rede local")
    parser.add_argument("--config", default=DEFAULT_CONFIG, help="caminho do config.json")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("learn", help="regista os dispositivos atuais como autorizados")
    sub.add_parser("scan", help="varre a rede e grava eventos")
    sub.add_parser("status", help="mostra o estado atual")

    p_report = sub.add_parser("report", help="gera o relatorio diario")
    p_report.add_argument("--day", help="YYYY-MM-DD, ou 'yesterday'")
    p_report.add_argument("--stdout", action="store_true", help="imprime em vez de so gravar")

    p_watch = sub.add_parser("watch", help="corre em ciclo")
    p_watch.add_argument("--interval", type=int, help="minutos entre varreduras")
    p_watch.add_argument("--day", help=argparse.SUPPRESS)
    p_watch.add_argument("--stdout", action="store_true", help=argparse.SUPPRESS)

    p_syslog = sub.add_parser("syslog", help="recebe syslog do router")
    p_syslog.add_argument("--port", type=int, help="porta UDP (default 1514)")

    args = parser.parse_args(argv)
    handlers = {
        "learn": cmd_learn,
        "scan": cmd_scan,
        "report": cmd_report,
        "watch": cmd_watch,
        "syslog": cmd_syslog,
        "status": cmd_status,
    }
    try:
        return handlers[args.command](args)
    except RuntimeError as exc:
        print("Erro: %s" % exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
