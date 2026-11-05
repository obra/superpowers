#!/usr/bin/env python3
"""Exercise native Kilo install/discovery and capture real outgoing requests.

The loopback endpoint returns an intentional HTTP 400, not a fake model reply.
This verifies runtime wiring, NOT model behavior; retain a real acceptance run too.
"""
import argparse
import http.server
import json
import os
from pathlib import Path
import signal
import shutil
import socket
import subprocess
import threading
import time
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kilo', required=True, help='Path to an installed Kilo CLI')
    parser.add_argument('--output', required=True, type=Path, help='New isolated evidence directory')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    args.output.mkdir(parents=True, exist_ok=False)
    base = args.output.resolve()
    project = base / 'project'
    project.mkdir()
    env = {k: v for k, v in os.environ.items() if not k.startswith(('KILO_', 'OPENCODE_')) and not k.endswith('API_KEY')}
    for name in ['HOME', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'XDG_CACHE_HOME', 'XDG_STATE_HOME']:
        folder = base / name.lower()
        folder.mkdir()
        env[name] = str(folder)
    env['SUPERPOWERS_DISABLE_TELEMETRY'] = '1'
    requests = []

    class Capture(http.server.BaseHTTPRequestHandler):
        def do_POST(self):
            requests.append(json.loads(self.rfile.read(int(self.headers['Content-Length']))))
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error":{"message":"Intentional request capture stop; no model response generated","type":"invalid_request_error","code":"capture_complete"}}')

        def log_message(self, format, *unused):
            pass

    capture = http.server.HTTPServer(('127.0.0.1', 0), Capture)
    threading.Thread(target=capture.serve_forever, daemon=True).start()

    def run(name, *command):
        result = subprocess.run([args.kilo, *command], cwd=project, env=env, text=True, capture_output=True, timeout=90)
        (base / (name + '.stdout')).write_text(result.stdout)
        (base / (name + '.stderr')).write_text(result.stderr)
        return result

    daemon = None
    log = None
    try:
        installed = run('install', 'plugin', repo.as_uri(), '--global')
        assert installed.returncode == 0, installed.stdout + installed.stderr
        config = {'provider': {'probe': {'npm': '@ai-sdk/openai-compatible', 'name': 'Capture only', 'options': {'baseURL': f'http://127.0.0.1:{capture.server_port}/v1', 'apiKey': 'not-a-credential-local-only'}, 'models': {'capture': {'name': 'capture', 'limit': {'context': 64000, 'output': 128}}}}}}
        (project / 'kilo.json').write_text(json.dumps(config))
        discovered = run('skills', 'debug', 'skill')
        assert discovered.returncode == 0, discovered.stderr
        names = {skill['name'] for skill in json.loads(discovered.stdout)}
        expected = {p.parent.name for p in (repo / 'skills').glob('*/SKILL.md')}
        assert expected <= names, {'missing': sorted(expected - names)}
        with socket.socket() as reservation:
            reservation.bind(('127.0.0.1', 0))
            port = reservation.getsockname()[1]
        log = open(base / 'server.log', 'w')
        daemon = subprocess.Popen([args.kilo, 'serve', '--hostname', '127.0.0.1', '--port', str(port)], cwd=project, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        url = f'http://127.0.0.1:{port}'

        def api(route, body=None):
            request = urllib.request.Request(url + route, data=None if body is None else json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(request, timeout=90) as response:
                return json.load(response)

        for _ in range(300):
            if daemon.poll() is not None:
                raise RuntimeError('Kilo server exited; inspect server.log')
            try:
                api('/global/health')
                break
            except (OSError, ValueError):
                time.sleep(0.1)
        else:
            raise RuntimeError('Kilo server did not become ready')
        parent = api('/session', {})
        child = api('/session', {'parentID': parent['id']})
        for name, session, count in [('root', parent, 1), ('child', child, 0)]:
            previous = len(requests)
            result = run(name, 'run', '--attach', url, '--dir', str(project), '--session', session['id'], '-m', 'probe/capture', '--format', 'json', "Let's make a react todo list")
            assert result.returncode != 0, 'Capture endpoint must report its deliberate HTTP error'
            assert len(requests) == previous + 1, result.stdout + result.stderr
            request = requests[-1]
            (base / (name + '.request.json')).write_text(json.dumps(request, indent=2))
            system = '\n'.join(m['content'] for m in request['messages'] if m['role'] == 'system')
            assert system.count('<EXTREMELY_IMPORTANT>\nYou have superpowers.') == count
            assert '<name>brainstorming</name>' in system
            if count:
                assert 'Tool Mapping for Kilo Code' in system
                assert system.count('You have superpowers.') == 1
            else:
                assert 'Tool Mapping for Kilo Code' not in system
        # An installed plugin must not turn project-controlled markdown into a
        # globally trusted source. Exercise the host's real scope downgrade.
        fixture = project / 'guard-checkout'
        fixture_plugin = fixture / '.kilo/plugin/superpowers.js'
        fixture_plugin.parent.mkdir(parents=True)
        shutil.copyfile(repo / '.kilo/plugin/superpowers.js', fixture_plugin)
        (fixture / 'package.json').write_text(json.dumps({'name': 'superpowers-scope-probe', 'type': 'module', 'exports': {'./server': './.kilo/plugin/superpowers.js'}}))
        skill = fixture / 'skills/scope-guard/SKILL.md'
        skill.parent.mkdir(parents=True)
        canary = base / 'outside-project-canary.txt'
        canary.write_text('outside-scope-canary')
        skill.write_text(f'---\nname: scope-guard\ndescription: Scope guard fixture\n---\n{{file:{canary}}}\n')
        control = fixture / 'skills/scope-control/SKILL.md'
        control.parent.mkdir(parents=True)
        control.write_text('---\nname: scope-control\ndescription: Positive discovery control\n---\nSafe project content.\n')
        for name in ['HOME', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'XDG_CACHE_HOME', 'XDG_STATE_HOME']:
            folder = base / ('guard-' + name.lower())
            folder.mkdir()
            env[name] = str(folder)
        (project / 'kilo.json').write_text('{}')
        guard_install = run('scope-install', 'plugin', fixture.as_uri(), '--global')
        assert guard_install.returncode == 0, guard_install.stdout + guard_install.stderr
        guard = run('scope-guard', 'debug', 'skill')
        assert guard.returncode == 0, guard.stderr
        guard_names = {s['name'] for s in json.loads(guard.stdout)}
        assert 'scope-control' in guard_names, 'Positive control must prove project plugin skill discovery'
        assert 'scope-guard' not in guard_names
        assert 'outside-scope-canary' not in guard.stdout
        print(json.dumps({'native_package_install': True, 'superpowers_skills_discovered': len(expected), 'root_bootstrap_count': 1, 'child_bootstrap_count': 0, 'project_source_scope_preserved': True, 'real_model_response': False, 'evidence': str(base)}, indent=2))
    finally:
        if daemon and daemon.poll() is None:
            os.killpg(daemon.pid, signal.SIGTERM)
            try:
                daemon.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(daemon.pid, signal.SIGKILL)
                daemon.wait()
        if log:
            log.close()
        capture.shutdown()
        capture.server_close()


if __name__ == '__main__':
    main()
