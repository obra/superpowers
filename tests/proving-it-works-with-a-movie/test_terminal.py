"""Windows terminal recorder timing, control, and native acceptance."""
import importlib.util
from pathlib import Path
import unittest

SCRIPT=Path(__file__).resolve().parents[2]/'skills/proving-it-works-with-a-movie/examples/film-terminal.py'

class TerminalPolicyTests(unittest.TestCase):
    def recorder(self):
        self.assertTrue(SCRIPT.is_file(), 'Windows recorder entry point is missing')
        spec=importlib.util.spec_from_file_location('film_terminal',SCRIPT)
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        return module

    def test_output_grid_never_uses_future_capture(self):
        m=self.recorder()
        self.assertEqual(m.frame_sources([10.,10.35,10.81],10.,11.),[0,0,1,1,1])
        self.assertEqual(m.frame_sources([10.],10.,10.),[0])
        self.assertEqual(m.frame_sources([10.,10.2],10.,10.4),[0,1,1])

    def test_capture_gaps_and_invalid_boundaries_fail(self):
        m=self.recorder()
        for times,start,end in [([],0,1),([1],0,2),([1],1,.9),([1,3,2],1,4),([1,4],1,3)]:
            with self.subTest(times=times),self.assertRaises(ValueError):m.frame_sources(times,start,end)
        for times,start,end in [([1,3.01],1,4),([1],1,3.01)]:
            with self.subTest(times=times),self.assertRaises(TimeoutError):m.frame_sources(times,start,end)

    def test_logger_cannot_hide_identified_producer_failure(self):
        m=self.recorder()
        good=dict(outcome='completed',shell_success=True,shell_error=None,native_producer='python.exe',producer_exit_code=0)
        self.assertTrue(m.command_succeeded(good))
        for change in [dict(producer_exit_code=7),dict(producer_exit_code=None),dict(outcome='unknown'),dict(outcome='interrupted'),dict(shell_success=None),dict(shell_error='failed')]:
            with self.subTest(change=change):self.assertFalse(m.command_succeeded(good|change))
        self.assertTrue(m.command_succeeded(good|dict(native_producer=None,producer_exit_code=None)))

import json
import os
import subprocess
import sys
import tempfile
import time

@unittest.skipUnless(sys.platform=='win32', 'native Windows terminal required')
class NativeTerminalTests(unittest.TestCase):
    def setUp(self):
        self.work=tempfile.TemporaryDirectory(prefix='movie-terminal-')
        self.addCleanup(self.work.cleanup)
        self.directory=Path(self.work.name)/'session'
        self.shell=os.environ.get('MOVIE_TEST_SHELL','powershell51')
        self.number=0
        identity=subprocess.run(['whoami','/all'],capture_output=True,check=True)
        self.assertIn(b'S-1-16-8192',identity.stdout)
        (Path(self.work.name)/'identity.txt').write_bytes(identity.stdout)
        self.log=(Path(self.work.name)/'serve.log').open('wb')
        self.addCleanup(self.log.close)
        argv=[sys.executable,str(SCRIPT),'serve','--shell',self.shell,'--directory',str(self.directory)]
        for flag,variable in [('shell-exe','MOVIE_TEST_SHELL_EXE'),('ttyd','MOVIE_TEST_TTYD')]:
            if os.environ.get(variable):argv+=['--'+flag,os.environ[variable]]
        self.server=subprocess.Popen(argv,stdout=self.log,stderr=subprocess.STDOUT)
        deadline=time.monotonic()+30
        while not (self.directory/'control/ready.json').exists() and self.server.poll() is None and time.monotonic()<deadline:time.sleep(.05)
        self.assertTrue((self.directory/'control/ready.json').exists(),(Path(self.work.name)/'serve.log').read_text(errors='replace'))

    def tearDown(self):
        if self.server.poll() is None:
            try:self.request('cancel')
            finally:
                try:self.server.wait(10)
                except subprocess.TimeoutExpired:self.server.kill();self.server.wait()
        self.log.close()
        evidence=os.environ.get('MOVIE_TERMINAL_EVIDENCE')
        if evidence:
            import shutil
            destination=Path(evidence)/(self.shell+'-'+self._testMethodName)
            shutil.copytree(self.work.name,destination,ignore=shutil.ignore_patterns('profile'),dirs_exist_ok=True)
        self.work.cleanup()

    def cli(self,*args):
        return subprocess.run([sys.executable,str(SCRIPT),*args],capture_output=True,timeout=40)

    def request(self,operation,wait=True,expected=0,timeout=30,**fields):
        self.number+=1
        file=Path(self.work.name)/f'request-{self.number}.json'
        file.write_text(json.dumps(dict(id=self.number,operation=operation,**fields)),encoding='utf-8')
        args=['request','--directory',str(self.directory),'--file',str(file),'--timeout',str(timeout)]
        if wait:args+=['--wait-result']
        r=self.cli(*args)
        self.assertEqual(r.returncode,expected,(r.stdout+r.stderr).decode(errors='replace'))
        return json.loads(r.stdout) if r.stdout.strip() else None

    def run_command(self,command,**kwargs):return self.request('run',command=command,**kwargs)

    def native(self,code):
        import base64
        payload=base64.b64encode(code.encode()).decode()
        exe=sys.executable.replace('\\','/')
        return ('' if self.shell=='gitbash' else '& ')+f"'{exe}' -c \"import base64;exec(base64.b64decode('{payload}'))\""

    def test_takes_pending_command_and_failure_recovery(self):
        ready=json.loads((self.directory/'control/ready.json').read_text())
        self.assertGreaterEqual(ready['geometry']['columns'],80)
        self.run_command("export MOVIE_VALUE=kept" if self.shell=='gitbash' else "$global:MovieValue='kept'")
        self.request('begin-take',name='first')
        r=self.run_command(self.native('import time;time.sleep(2);print("long command done")'),wait=True,expected=1,timeout=.2)
        self.assertEqual(r['outcome'],'client-timeout')
        pending=self.number
        self.run_command("echo must-not-run",expected=1)
        inspect=self.request('inspect');self.assertEqual(inspect['pending']['id'],pending)
        first=self.request('end-take');self.assertEqual(first['kind'],'frames')
        self.request('begin-take',name='second')
        r=self.cli('result','--directory',str(self.directory),'--id',str(pending),'--timeout','10')
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        fixture=Path(__file__).parent/'fixtures/terminal_app.py'
        code=f"import runpy,sys;sys.argv=['fixture','states'];runpy.run_path({str(fixture)!r},run_name='__main__')"
        self.run_command(self.native(code),wait=False,native_producer=sys.executable)
        tui=self.number
        time.sleep(6.5)
        self.request('key',key='q')
        self.assertEqual(self.cli('result','--directory',str(self.directory),'--id',str(tui)).returncode,0)
        take=self.request('end-take')
        self.assertEqual(take['session_id'],ready['session_id'])
        from PIL import Image
        colors=[]
        for png in sorted(Path(take['src']).glob('*.png')):
            # Require a solid block; a colored shell prompt is not a TUI state.
            image=Image.open(png).convert('RGB')
            pixel=image.getpixel((100,60))
            if sum(count for count,value in image.crop((40,30,440,140)).getcolors(44000) if value==pixel)<30000:continue
            if pixel[0]>pixel[1]*1.5 and pixel[0]>pixel[2]*1.5:color='red'
            elif pixel[1]>pixel[0]*1.5 and pixel[1]>pixel[2]*1.5:color='green'
            elif pixel[2]>pixel[0]*1.5 and pixel[2]>pixel[1]*1.3:color='blue'
            else:continue
            if not colors or colors[-1]!=color:colors.append(color)
        self.assertEqual(colors,['red','green','blue'])
        command="test \"$MOVIE_VALUE\" = kept" if self.shell=='gitbash' else "if ($MovieValue -ne 'kept') {throw 'state lost'}"
        self.run_command(command)
        logging=' | cat' if self.shell=='gitbash' else ' | Tee-Object -Variable MovieLog'
        failure=self.run_command(self.native('import sys;print("producer");sys.exit(7)')+logging,native_producer=sys.executable,expected=1)
        self.assertEqual(failure['producer_exit_code'],7)
        self.run_command('echo recovered')
        self.request('close');self.assertEqual(self.server.wait(10),0)

    def test_native_shell_outcomes(self):
        spec=importlib.util.spec_from_file_location('historical_probe',Path(__file__).with_name('probe-windows.py'))
        probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)
        import argparse
        args=argparse.Namespace(shell_kind=self.shell,shell=os.environ['MOVIE_TEST_SHELL_EXE'])
        for name,command,native in probe.outcome_commands(args):
            success=name in ('native_success','cmdlet_success','shell_success')
            result=self.run_command(command,native_producer=native,expected=0 if success else 1)
            self.assertEqual(result['outcome'],'completed')
            if name=='expression_wrapper':
                self.assertEqual(result['raw_shell_success'],self.shell=='powershell51')
            if name=='logging_failure':self.assertEqual(result['producer_exit_code'],7)
        if self.shell != 'gitbash':
            self.run_command(self.native('import sys;sys.exit(0)'),native_producer=sys.executable)
            missing=self.run_command("Write-Output 'no native process ran'",native_producer=sys.executable,expected=1)
            self.assertIsNone(missing['producer_exit_code'])
        self.request('close')
        self.assertEqual(self.server.wait(10),0)

    def test_command_deadline_ends_session_and_marks_take_incomplete(self):
        self.request('begin-take',name='timeout')
        result=self.run_command(self.native('import time;time.sleep(30)'),timeout_seconds=.4,expected=1)
        self.assertEqual(result['outcome'],'unknown')
        self.assertIsNone(result['shell_success'])
        self.assertNotEqual(self.server.wait(10),0)
        self.assertTrue(json.loads((self.directory/'timeout/take.json').read_text())['incomplete'])

    def test_gap_duplicate_and_rejection_leave_cancellation_usable(self):
        file=Path(self.work.name)/'gap.json';file.write_text('{"id":2,"operation":"inspect"}')
        result=self.cli('request','--directory',str(self.directory),'--file',str(file),'--timeout','1')
        self.assertNotEqual(result.returncode,0)
        self.assertFalse((self.directory/'control/000002.request.json').exists())
        self.request('key',key='F99',expected=1)
        self.assertEqual(json.loads((self.directory/'control/status.json').read_text())['next_request_id'],2)
        first=Path(self.work.name)/'request-1.json'
        result=self.cli('request','--directory',str(self.directory),'--file',str(first),'--timeout','1')
        self.assertNotEqual(result.returncode,0)
        self.request('cancel');self.assertEqual(self.server.wait(10),0)

    def own_descendants(self):
        fixture=Path(__file__).parent/'fixtures/terminal_app.py'
        directory=Path(self.work.name)/'descendants'
        code=f"import runpy,sys;sys.argv=['fixture','tree',{str(directory)!r}];runpy.run_path({str(fixture)!r},run_name='__main__')"
        self.run_command(self.native(code),wait=False,native_producer=sys.executable)
        deadline=time.monotonic()+10
        while time.monotonic()<deadline and len(list(directory.glob('*.json')))<3:time.sleep(.05)
        pids=[json.loads(p.read_text())['pid'] for p in directory.glob('*.json')]
        self.assertEqual(len(pids),3)
        launches=json.loads((self.directory/'launches.json').read_text())
        return pids+[v['pid'] for v in launches]

    def assert_dead(self,pids):
        import ctypes
        from ctypes import wintypes as W
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.OpenProcess.argtypes=[W.DWORD,W.BOOL,W.DWORD];kernel.OpenProcess.restype=W.HANDLE
        kernel.WaitForSingleObject.argtypes=[W.HANDLE,W.DWORD];kernel.CloseHandle.argtypes=[W.HANDLE]
        deadline=time.monotonic()+10
        alive=pids
        while alive and time.monotonic()<deadline:
            alive=[]
            for pid in pids:
                handle=kernel.OpenProcess(0x100000,False,pid)
                if handle:
                    if kernel.WaitForSingleObject(handle,0)==258:alive.append(pid)
                    kernel.CloseHandle(handle)
            if alive:time.sleep(.05)
        self.assertEqual(alive,[])

    def cleanup_case(self,mode):
        sentinel=subprocess.Popen([sys.executable,'-c','import time;time.sleep(180)'])
        try:
            pids=self.own_descendants()
            self.request('begin-take',name='cleanup')
            if mode in ('close','cancel'):
                self.request(mode);self.assertEqual(self.server.wait(10),0)
                take=json.loads((self.directory/'cleanup/take.json').read_text())
                self.assertEqual(take['incomplete'],mode=='cancel')
            elif mode=='forced-exit':self.server.kill();self.server.wait(10)
            elif mode=='browser-loss':
                launches=json.loads((self.directory/'launches.json').read_text())
                browser=next(v['pid'] for v in launches if v['name']=='browser')
                subprocess.run(['taskkill','/PID',str(browser),'/F'],capture_output=True,check=True)
                self.assertNotEqual(self.server.wait(10),0)
            elif mode=='capture-write':
                samples=self.directory/'cleanup/samples'
                samples.rename(samples.with_name('saved-samples'));samples.write_text('blocked')
                self.assertNotEqual(self.server.wait(10),0)
            elif mode=='report-write':
                result_path=self.directory/'control'/f'{self.number+1:06d}.result.json';result_path.mkdir()
                self.request('close',expected=1,timeout=1)
                self.assertNotEqual(self.server.wait(10),0)
            elif mode=='control-write':
                status=self.directory/'control/status.json';status.unlink();status.mkdir()
                # Publish directly: client status validation correctly cannot read a directory.
                number=self.number+1
                (self.directory/'control'/f'{number:06d}.request.json').write_text(json.dumps(dict(id=number,operation='inspect')))
                self.assertNotEqual(self.server.wait(10),0)
            self.assert_dead(pids)
            self.assertIsNone(sentinel.poll())
            (Path(self.work.name)/'cleanup-evidence.json').write_text(json.dumps(dict(mode=mode,owned_pids=pids,owned_remaining=[],sentinel_pid=sentinel.pid,sentinel_alive=True)))
        finally:
            sentinel.terminate();sentinel.wait(10)

    def test_normal_cleanup(self):self.cleanup_case('close')
    def test_cancel_cleanup(self):self.cleanup_case('cancel')
    def test_browser_loss_cleanup(self):self.cleanup_case('browser-loss')
    def test_forced_exit_cleanup(self):self.cleanup_case('forced-exit')
    def test_capture_write_failure_cleanup(self):self.cleanup_case('capture-write')
    def test_report_write_failure_cleanup(self):self.cleanup_case('report-write')
    def test_control_write_failure_cleanup(self):self.cleanup_case('control-write')

    def test_geometry_change_ends_session(self):
        pids=self.own_descendants()
        self.request('begin-take',name='geometry')
        launches=json.loads((self.directory/'launches.json').read_text())
        browser=next(v for v in launches if v['name']=='browser')
        port=next(v.split('=')[1] for v in browser['argv'] if v.startswith('--remote-debugging-port='))
        import urllib.request,websocket
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list') as response:pages=json.load(response)
        page=next(page for page in pages if page['type']=='page' and page['url'].startswith('http://127.0.0.1:'))
        ws=websocket.create_connection(page['webSocketDebuggerUrl'],suppress_origin=True)
        try:
            ws.send(json.dumps(dict(id=1,method='Runtime.evaluate',params=dict(expression="document.querySelector('.xterm').parentElement.style.width='800px'; window.dispatchEvent(new Event('resize')); document.querySelector('.xterm').parentElement.getBoundingClientRect().width",returnByValue=True))))
            resize=json.loads(ws.recv())
            self.assertNotIn('error',resize)
            (Path(self.work.name)/'resize-response.json').write_text(json.dumps(dict(page=page,response=resize)))
            self.assertEqual(resize['result']['result'].get('value'),800,resize)
            self.assertNotEqual(self.server.wait(10),0)
        finally:ws.close()
        self.assert_dead(pids)
        self.assertTrue(json.loads((self.directory/'geometry/take.json').read_text())['incomplete'])


class CaptureBoundaryTests(unittest.TestCase):
    recorder = TerminalPolicyTests.recorder
    def test_screenshot_deadline_is_bounded(self):
        from types import SimpleNamespace
        m=self.recorder();recorder=m.Recorder.__new__(m.Recorder)
        recorder.take={'samples':[]}
        recorder.capture=(1,time.monotonic()-2.01)
        recorder.terminal=SimpleNamespace(cdp=SimpleNamespace(responses={}))
        with self.assertRaises(TimeoutError):recorder.capture_tick()

    def test_end_take_drains_existing_screenshot_before_next_take(self):
        from types import SimpleNamespace
        m=self.recorder()
        with tempfile.TemporaryDirectory() as temporary:
            directory=Path(temporary);(directory/'samples').mkdir()
            (directory/'samples/0.png').write_bytes(b'first')
            recorder=m.Recorder.__new__(m.Recorder)
            start=time.monotonic()
            recorder.take=dict(name='one',directory=str(directory),start=start,begin_request=1,
                               samples=[dict(path=str(directory/'samples/0.png'),requested=start,completed=start)])
            recorder.capture=(9,start);recorder.capture_due=start+100
            class CDP:
                responses={}
                def pump(self):self.responses[9]={'result':{'data':'c2Vjb25k'}}
            recorder.geometry=dict(columns=220,rows=59)
            recorder.terminal=SimpleNamespace(cdp=CDP(),closed=False,terminal_sizes=[recorder.geometry.copy()])
            result=recorder.end()
            self.assertEqual(len(result['samples']),2)
            self.assertFalse(recorder.terminal.cdp.responses)

    def test_late_screenshot_response_is_still_a_timeout(self):
        from types import SimpleNamespace
        m=self.recorder();recorder=m.Recorder.__new__(m.Recorder)
        with tempfile.TemporaryDirectory() as temporary:
            (Path(temporary)/'samples').mkdir()
            recorder.take={'directory':temporary,'samples':[{}]}
            recorder.capture_due=time.monotonic()+10
            recorder.capture=(1,time.monotonic()-2.01)
            recorder.terminal=SimpleNamespace(cdp=SimpleNamespace(responses={1:{'result':{'data':'YQ=='}}}))
            with self.assertRaises(TimeoutError):recorder.capture_tick()

class ClientWaitTests(unittest.TestCase):
    recorder = TerminalPolicyTests.recorder

    def test_ack_and_result_share_one_client_wait_budget(self):
        import threading
        from types import SimpleNamespace
        m=self.recorder()
        with tempfile.TemporaryDirectory() as temporary:
            directory=Path(temporary);control=directory/'control';control.mkdir()
            m.write_json(control/'status.json',dict(next_request_id=1,closed=False))
            request=directory/'request.json';m.write_json(request,dict(id=1,operation='run',command='waiting'))
            def acknowledge():
                while not (control/'000001.request.json').exists():time.sleep(.01)
                time.sleep(.4)
                m.write_json(control/'000001.ack.json',dict(accepted=True))
            worker=threading.Thread(target=acknowledge);worker.start()
            started=time.monotonic()
            try:reply,code=m.client(SimpleNamespace(directory=directory,action='request',file=request,timeout=.6,wait_result=True))
            finally:worker.join()
            self.assertEqual(code,1)
            self.assertEqual(reply['outcome'],'client-timeout')
            self.assertLess(time.monotonic()-started,.85)
            before=sorted(p.name for p in control.iterdir())
            m.write_json(control/'000001.result.json',dict(outcome='completed',success=True))
            reply,code=m.client(SimpleNamespace(directory=directory,action='result',id=1,timeout=.1))
            self.assertEqual(code,0)
            self.assertEqual(sorted(p.name for p in control.iterdir()),sorted(before+['000001.result.json']))


class FinalizationHealthTests(unittest.TestCase):
    recorder = TerminalPolicyTests.recorder

    def session(self, fault=None):
        """Exercise real recorder/control files; inject CDP events at the drain boundary."""
        from types import SimpleNamespace
        from unittest.mock import patch
        m=self.recorder()
        temporary=tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        directory=Path(temporary.name)/'session'

        class Terminal:
            def __init__(self,args,directory):
                directory.mkdir()
                self.session='finalization-session'
                self.closed=False
                self.released=False
                self.terminal_sizes=[dict(columns=220,rows=59)]
                self.parser=SimpleNamespace(records=[])
                terminal=self
                class CDP:
                    def __init__(self):self.responses={};self.pumps=0
                    def pump(self):
                        self.pumps+=1
                        if self.pumps==2:
                            if fault=='loss':terminal.closed=True
                            if fault=='geometry':terminal.terminal_sizes.append(dict(columns=100,rows=59))
                            self.responses[9]={'result':{'data':'c2Vjb25k'}}
                self.cdp=CDP()
            def start(self):pass
            def readiness(self):return dict(session=self.session,shell='powershell51',cwd=str(directory))
            def install_prompt(self):pass
            def close(self):self.released=True

        with patch.object(m,'Terminal',Terminal):
            recorder=m.Recorder(SimpleNamespace(directory=directory))
        recorder.geometry=dict(columns=220,rows=59)
        recorder.begin('take',0)
        start=time.monotonic()
        sample=directory/'take/samples/000000.png';sample.write_bytes(b'first')
        recorder.take.update(start=start,samples=[dict(path=str(sample),requested=start,completed=start)])
        recorder.capture=(9,start)
        recorder.capture_due=start+100
        return m,recorder

    def test_close_rejects_terminal_loss_during_final_capture(self):
        self.check_close_fault('loss',ConnectionError)

    def test_close_rejects_geometry_change_during_final_capture(self):
        self.check_close_fault('geometry',RuntimeError)

    def check_close_fault(self,fault,error):
        m,recorder=self.session(fault)
        m.write_json(recorder.control/'000001.request.json',dict(id=1,operation='close'))
        with self.assertRaises(error):recorder.run()
        self.assertTrue(recorder.terminal.released)
        self.assertTrue(m.read_json(recorder.args.directory/'take/take.json')['incomplete'])
        self.assertFalse(m.read_json(recorder.control/'000001.result.json')['success'])

    def test_healthy_close_still_finalizes_after_draining(self):
        m,recorder=self.session()
        m.write_json(recorder.control/'000001.request.json',dict(id=1,operation='close'))
        recorder.run()
        self.assertTrue(recorder.terminal.released)
        self.assertFalse(m.read_json(recorder.args.directory/'take/take.json')['incomplete'])
        self.assertTrue(m.read_json(recorder.control/'000001.result.json')['success'])

    def test_finalization_without_pending_capture_checks_observation(self):
        for fault,error in [('loss',ConnectionError),('geometry',RuntimeError)]:
            with self.subTest(fault=fault):
                m,recorder=self.session()
                recorder.capture=None
                if fault=='loss':recorder.terminal.closed=True
                else:recorder.terminal.terminal_sizes.append(dict(columns=100,rows=59))
                with self.assertRaises(error):recorder.end()
                recorder.end(incomplete=True)
                self.assertTrue(m.read_json(recorder.args.directory/'take/take.json')['incomplete'])
