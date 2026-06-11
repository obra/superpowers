const assert = require('assert');
const {
  browserLauncherForPlatform
} = require('../../skills/brainstorming/scripts/server.cjs');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL: ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

(async () => {
  console.log('\n--- Browser Launcher ---');

  await test('Windows launcher does not route URLs through cmd.exe', () => {
    const url = 'http://localhost:54122/?key=abc&x=SAFE&echo=INJECTED';
    const launcher = browserLauncherForPlatform(url, {
      platform: 'win32',
      osRelease: '10.0.26200',
      env: {}
    });

    assert.deepStrictEqual(launcher, {
      bin: 'rundll32.exe',
      args: ['url.dll,FileProtocolHandler', url]
    });
    assert(!launcher.args.includes('/c'), 'Windows launcher must not pass /c to a command interpreter');
  });

  await test('WSL launcher does not route URLs through cmd.exe', () => {
    const url = 'http://localhost:54122/?key=abc&x=SAFE&echo=INJECTED';
    const launcher = browserLauncherForPlatform(url, {
      platform: 'linux',
      osRelease: '5.15.167.4-microsoft-standard-WSL2',
      env: {}
    });

    assert.deepStrictEqual(launcher, {
      bin: 'rundll32.exe',
      args: ['url.dll,FileProtocolHandler', url]
    });
  });

  await test('Linux launcher stays headless without a display', () => {
    assert.strictEqual(
      browserLauncherForPlatform('http://localhost:1/', {
        platform: 'linux',
        osRelease: '6.0.0',
        env: {}
      }),
      null
    );
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
})();
