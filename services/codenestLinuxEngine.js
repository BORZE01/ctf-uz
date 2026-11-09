'use strict';

const path = require('path');

const TARGET_IP = '192.168.56.101';
const TARGET_HOST = 'codenest-ubuntu';
const STUDENT_FLAG_PATH = '/home/student/.config/system/.cache/tmp/.hidden/Flag1.txt';
const DEVUSER_FLAG_PATH = '/opt/codenest/Flag2.txt';
const ROOT_FLAG_PATH = '/root/Flag3.txt';
const BACKUP_SCRIPT = '/opt/codenest/backup.sh';
const CLEANUP_SCRIPT = '/opt/codenest/cleanup.sh';
const SUID_TOOL = '/usr/local/bin/backup_tool';
const SUID_SOURCE = '/opt/codenest/backup_tool.c';
const DEVUSER_PASSWORD = 'D3vUser_B@ckup2024';

const DEFAULT_STATE = Object.freeze({
  currentUser: 'kali',
  pendingAuth: '',
  cwd: '/home/kali',
  targetDiscovered: false,
  sshPortVerified: false,
  bruteForced: false,
  rockyouReady: true,
  flag1Located: false,
  flag1Read: false,
  backupInspected: false,
  devuserAuthenticated: false,
  flag2Read: false,
  sudoInspected: false,
  cronInspected: false,
  suidInspected: false,
  cronPayloadInstalled: false,
  cronTriggered: false,
  pathHelperCreated: false,
  pathHelperExecutable: false,
  pathHijackActive: false,
  backupToolExecuted: false,
  bashSuid: false,
  virtualSeconds: 0,
  rootVia: ''
});

function promptForCodenest(state) {
  const c = state.codenest || DEFAULT_STATE;
  if (c.pendingAuth) return 'Password:';
  if (!state.connected) return 'kali@kali:~$';
  const user = c.currentUser || 'student';
  const cwd = c.cwd || `/home/${user}`;
  const shown = cwd === `/home/${user}` ? '~' : cwd;
  return `${user}@${TARGET_HOST}:${shown}${user === 'root' ? '#' : '$'}`;
}

function makeResult(output, next) {
  return { output, state: next, prompt: promptForCodenest(next) };
}

function markObjective(state, index) {
  state.objectivesCompleted = Array.isArray(state.objectivesCompleted)
    ? state.objectivesCompleted
    : [false, false, false, false];
  while (state.objectivesCompleted.length < 4) state.objectivesCompleted.push(false);
  state.objectivesCompleted[index] = true;
}

function isRoot(state) {
  return Boolean(state.elevated || state.codenest.currentUser === 'root');
}

function normalizePath(cwd, requested) {
  const raw = String(requested || '.').replace(/^~(?=\/|$)/, '/home/student');
  return path.posix.normalize(raw.startsWith('/') ? raw : path.posix.join(cwd || '/', raw));
}

function targetListing(directory, currentUser) {
  const dir = directory.replace(/\/$/, '') || '/';
  if (dir === '/opt/codenest') {
    return [
      'total 24',
      'drwxr-xr-x 2 root    root    4096 Nov  8 18:02 .',
      'drwxr-xr-x 4 root    root    4096 Nov  8 17:40 ..',
      '-rw-r--r-- 1 root    root     154 Nov  8 17:51 backup.sh',
      '-rw-rw-rw- 1 root    root      52 Nov  8 17:52 cleanup.sh',
      '-rw------- 1 devuser devuser   58 Nov  8 17:48 Flag2.txt',
      '-rw-r--r-- 1 root    root     191 Nov  8 17:54 backup_tool.c'
    ].join('\n');
  }
  if (dir === '/home/student') {
    return 'total 20\ndrwxr-xr-x 5 student student 4096 Nov  8 17:45 .\ndrwxr-xr-x 5 root    root    4096 Nov  8 17:40 ..\n-rw-r--r-- 1 student student  220 .bash_logout\n-rw-r--r-- 1 student student 3771 .bashrc\n-rw-r--r-- 1 student student  807 .profile\ndrwx------ 3 student student 4096 Nov  8 17:46 .config';
  }
  if (dir === '/home/devuser') {
    return 'total 16\ndrwxr-xr-x 4 devuser devuser 4096 Nov  8 17:47 .\ndrwxr-xr-x 5 root    root    4096 Nov  8 17:40 ..\ndrwxr-xr-x 2 devuser devuser 4096 Nov  8 17:47 data\n-rw-r--r-- 1 devuser devuser  807 .profile';
  }
  if (dir === '/home/student/.config/system/.cache/tmp/.hidden') {
    return '-rw------- 1 student student 64 Nov  8 17:46 Flag1.txt';
  }
  if (dir === '/usr/local/bin') {
    return '-rwsr-xr-x 1 root root 16016 Nov  8 17:54 backup_tool';
  }
  if (dir === '/root') {
    return currentUser === 'root'
      ? 'total 16\ndrwx------  4 root root 4096 Nov  8 17:40 .\n-rw-------  1 root root   94 Nov  8 17:55 Flag3.txt\n-rw-------  1 root root  220 .bash_history'
      : 'ls: cannot open directory \'/root\': Permission denied';
  }
  if (dir === '/etc/cron.d') return '-rw-r--r-- 1 root root 76 Nov  8 17:52 codenest-cleanup';
  if (dir === '/tmp') return 'drwxrwxrwt 8 root    root    4096 Nov  8 17:40 .\ndrwxr-xr-x 2 student student 4096 Nov  8 17:46 systemd-private/\ndrwxr-xr-x 2 devuser devuser 4096 Nov  8 17:50 hijack/';
  if (dir === '/') return 'bin/ boot/ dev/ etc/ home/ lib/ lib64/ media/ mnt/ opt/ proc/ root/ run/ sbin/ srv/ sys/ tmp/ usr/ var/';
  if (dir === '/etc') return 'cron.d/ passwd group shadow hostname os-release sudoers.d/ ssh/';
  if (dir === '/usr/local') return 'bin/ share/';
  return `ls: cannot access '${directory}': No such file or directory`;
}

function executeCodenestCommand(lab, sessionId, state, rawCommand, expectedFlag) {
  const command = String(rawCommand || '').trim();
  const lower = command.toLowerCase().replace(/\s+/g, ' ');
  const next = {
    ...state,
    objectivesCompleted: [...(state.objectivesCompleted || [false, false, false, false])],
    codenest: { ...DEFAULT_STATE, ...(state.codenest || {}) }
  };
  const c = next.codenest;
  while (next.objectivesCompleted.length < 4) next.objectivesCompleted.push(false);
  if (!command) return makeResult('', next);
  if (command.length > 180) return makeResult('Xato: buyruq 180 belgidan oshmasligi kerak.', next);
  if (/\u0000|[\r\n]/.test(command)) return makeResult('Xato: bitta buyruq yuboring.', next);

  // su prompts are modeled as a separate input state. The route/UI masks this
  // one-time password input in terminal history and local command history.
  if (c.pendingAuth === 'devuser') {
    c.pendingAuth = '';
    if (command === DEVUSER_PASSWORD && next.connected && c.currentUser === 'student' && c.backupInspected) {
      c.currentUser = 'devuser';
      c.cwd = '/home/devuser';
      c.devuserAuthenticated = true;
      markObjective(next, 1);
      return makeResult('Authentication successful.\nWelcome to Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-126-generic x86_64)\nLast login: Sun Nov  8 18:02:11 2026 from 192.168.56.10\n', next);
    }
    return makeResult('su: Authentication failure', next);
  }

  if (lower === 'clear' || lower === 'cls') return makeResult('[CLEAR]', next);
  if (lower === 'help') {
    return makeResult(
      'CodeNest LinuxPrivEsc Lab — Kali attack box / Ubuntu 22.04.5 target\n' +
      'Kali: ip a, ip route, ping, nmap, hydra, ssh, ls, cat, whoami, uname -a\n' +
      'Ubuntu: whoami, id, groups, hostname, uname -a, pwd, cd, ls -la, cat, grep, find, stat, file, getent, ps aux, ss -tulpn, sudo -l, su, sleep, bash -p\n' +
      'Target: 192.168.56.101 | SSH: 22/tcp | foydalanuvchilar: student, devuser, root\n' +
      'Eslatma: buyruqlar faqat CodeNest virtual terminalida simulyatsiya qilinadi; host OS yoki real tarmoqqa yuborilmaydi.', next);
  }

  if (lower === 'exit' && next.connected) {
    next.connected = false;
    next.elevated = false;
    c.currentUser = 'kali';
    c.cwd = '/home/kali';
    c.pendingAuth = '';
    return makeResult('SSH sessiyasi yopildi. Kali attack box’ga qaytdingiz. Target konfiguratsiyasi va lab progressi saqlandi.', next);
  }

  // Kali attack-box commands.
  if (!next.connected) {
    if (lower === 'pwd') return makeResult('/home/kali', next);
    if (lower === 'whoami') return makeResult('kali', next);
    if (lower === 'hostname') return makeResult('kali-codenest', next);
    if (lower === 'uname -a') return makeResult('Linux kali-codenest 6.8.11-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', next);
    if (lower === 'cat /etc/os-release') return makeResult('PRETTY_NAME="Kali GNU/Linux Rolling"\nID=kali\nID_LIKE=debian\nVERSION="2026.3"', next);
    if (lower === 'ip a' || lower === 'ip addr' || lower === 'ip address') {
      return makeResult('1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500\n    inet 192.168.56.10/24 brd 192.168.56.255 scope global eth0', next);
    }
    if (lower === 'ip route') return makeResult('192.168.56.0/24 dev eth0 proto kernel scope link src 192.168.56.10\ndefault via 192.168.56.1 dev eth0', next);
    if (lower === 'ip neigh') return makeResult(c.targetDiscovered ? '192.168.56.1 dev eth0 lladdr 08:00:27:11:22:01 REACHABLE\n192.168.56.101 dev eth0 lladdr 08:00:27:aa:bb:cc STALE' : '192.168.56.1 dev eth0 lladdr 08:00:27:11:22:01 REACHABLE', next);
    if (lower.startsWith('ping ')) {
      const ip = command.split(/\s+/).pop();
      return makeResult(ip === TARGET_IP
        ? `PING ${TARGET_IP} (${TARGET_IP}) 56(84) bytes of data.\n64 bytes from ${TARGET_IP}: icmp_seq=1 ttl=64 time=0.42 ms\n--- ${TARGET_IP} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`
        : `PING ${ip}: Host is up (simulated lab network).\n1 packets transmitted, 1 received, 0% packet loss`, next);
    }
    if (lower === 'ls' || lower === 'ls -la') return makeResult('Desktop  Documents  Downloads  lab-notes.txt', next);
    if (lower.startsWith('ls /usr/share/wordlists') || lower.startsWith('ls -la /usr/share/wordlists') || lower.startsWith('ls -l /usr/share/wordlists')) {
      return makeResult('total 134M\n-rw-r--r-- 1 root root 139921497 Nov  8 17:35 rockyou.txt', next);
    }
    if (lower === 'which nmap' || lower === 'whereis nmap') return makeResult('nmap: /usr/bin/nmap /usr/share/man/man1/nmap.1.gz', next);
    if (lower === 'which hydra' || lower === 'whereis hydra') return makeResult('hydra: /usr/bin/hydra /usr/share/man/man1/hydra.1.gz', next);
    if (lower === 'which ssh') return makeResult('ssh: /usr/bin/ssh', next);
    if (lower === 'ssh -v' || lower === 'ssh -version') return makeResult('OpenSSH_9.9p1 Debian-3, OpenSSL 3.5.0 8 Apr 2025', next);
    if (lower === 'nmap --version') return makeResult(`Nmap version 7.94SVN ( https://nmap.org )
Platform: x86_64-pc-linux-gnu
Compiled with: liblua-5.4.6 openssl-3.5.0 libssh2-1.11.1`, next);
    if (lower === 'hydra -h' || lower === 'hydra --help') return makeResult(`Hydra 9.5 usage: hydra -l LOGIN -P WORDLIST ssh://TARGET
CodeNest profile: hydra -l student -P rockyou.txt ssh://192.168.56.101`, next);
    if (lower === 'ifconfig') return makeResult(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.56.10  netmask 255.255.255.0  broadcast 192.168.56.255
lo: inet 127.0.0.1  netmask 255.0.0.0`, next);
    if (lower === 'cat lab-notes.txt') return makeResult(`Target OS: Ubuntu Server 22.04.5 LTS\nTarget IP: ${TARGET_IP}\nAttack box: Kali Linux 192.168.56.10/24\nObjective: student -> devuser -> root`, next);

    if (lower.startsWith('nmap ')) {
      if (/192\.168\.56\.0\/24/.test(lower)) {
        c.targetDiscovered = true;
        return makeResult('Starting Nmap 7.94SVN ( https://nmap.org )\nNmap scan report for 192.168.56.1\nHost is up (0.0008s latency).\nNmap scan report for codenest-ubuntu (192.168.56.101)\nHost is up (0.0011s latency).\nNmap scan report for 192.168.56.254\nHost is up (0.0014s latency).\nNmap done: 256 IP addresses (3 hosts up) scanned in 2.41 seconds', next);
      }
      if (lower.includes(TARGET_IP) && /-p\s*22/.test(lower) && /-s?v/.test(lower)) {
        if (!c.targetDiscovered) return makeResult('Note: target hali subnet scan’da aniqlanmadi. Avval nmap 192.168.56.0/24 bajaring.', next);
        c.sshPortVerified = true;
        return makeResult(`Starting Nmap 7.94SVN ( simulated )\nNmap scan report for codenest-ubuntu (${TARGET_IP})\nHost is up (0.0010s latency).\nPORT   STATE SERVICE VERSION\n22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)\nService Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel\nNmap done: 1 IP address (1 host up) scanned in 0.31 seconds`, next);
      }
      if (lower.includes(TARGET_IP)) return makeResult(`Nmap scan report for ${TARGET_IP}\nHost is up.\nPORT   STATE SERVICE\n22/tcp open  ssh\nUse -p22 -sV to inspect the SSH service version.`, next);
      return makeResult('Nmap: ushbu virtual labda faqat 192.168.56.0/24 va 192.168.56.101 target manzili mavjud.', next);
    }

    if (lower.startsWith('hydra ')) {
      const validTarget = lower.includes(TARGET_IP) && /-l\s+student\b/.test(lower) && /\s-p\s+(?:rockyou\.txt|\/usr\/share\/wordlists\/rockyou\.txt)\b/.test(lower) && /ssh/.test(lower);
      if (!c.targetDiscovered || !c.sshPortVerified) return makeResult('[ERROR] SSH port/service hali tekshirilmagan. Avval nmap -p22 -sV 192.168.56.101 bajaring.', next);
      if (!validTarget) return makeResult('[DATA] Hydra 9.5 — labda mavjud wordlist va student account bilan ishlaydi. Sintaksis: hydra -l student -P rockyou.txt ssh://192.168.56.101', next);
      if (!c.rockyouReady) return makeResult('[ERROR] rockyou.txt wordlist mavjud emas. Kali wordlist katalogini tekshiring.', next);
      c.bruteForced = true;
      return makeResult('Hydra v9.5 (c) 2023 by van Hauser/THC\n[DATA] max 16 tasks per 1 server, overall 16 tasks, 16 login tries (l:1/p:16), ~16 tries per task\n[22][ssh] host: 192.168.56.101   login: student   password: princess1\n1 of 1 target successfully completed, 1 valid password found\nHydra simulated runtime: 00:05:38 (rockyou.txt profile). No packets were sent to a real host.', next);
    }

    const sshMatch = lower.match(/^ssh\s+(?:-p\s+22\s+)?student@192\.168\.56\.101$/);
    if (sshMatch) {
      if (!c.bruteForced) return makeResult('student@192.168.56.101: Permission denied (publickey,password).\nEslatma: CodeNest targetiga lab ichidagi SSH credential topilgandan keyin kirish mumkin.', next);
      next.connected = true;
      next.elevated = false;
      c.currentUser = 'student';
      c.cwd = '/home/student';
      markObjective(next, 0);
      return makeResult('The authenticity of host \'192.168.56.101 (192.168.56.101)\' can\'t be established.\nED25519 key fingerprint is SHA256:CodeNestLabUbuntu2204VirtualHostKey.\nAre you sure you want to continue connecting (yes/no/[fingerprint])? yes\nWarning: Permanently added \'192.168.56.101\' to the list of known hosts.\nstudent@192.168.56.101\'s password: ********\nWelcome to Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-126-generic x86_64)\nLast login: Sun Nov  8 17:58:02 2026 from 192.168.56.10\n', next);
    }
    if (lower.startsWith('ssh ')) return makeResult(`ssh: connection to ${TARGET_IP} denied or unsupported. Ushbu lab uchun: ssh student@${TARGET_IP}`, next);
    if (lower.startsWith('hydra') || lower === 'nmap') return makeResult('Kali: buyruq sintaksisini help orqali tekshiring.', next);
    return makeResult(`bash: ${command.split(/\s+/)[0]}: command not found (virtual Kali attack box). Type 'help' for supported commands.`, next);
  }

  // Ubuntu 22.04.5 target shell.
  const user = c.currentUser;
  const root = isRoot(next);
  if (lower === 'whoami') return makeResult(root ? 'root' : user, next);
  if (lower === 'id') {
    if (root) return makeResult('uid=0(root) gid=0(root) groups=0(root)', next);
    if (user === 'devuser') return makeResult('uid=1002(devuser) gid=1002(devuser) groups=1002(devuser),27(sudo)', next);
    return makeResult('uid=1001(student) gid=1001(student) groups=1001(student),100(users)', next);
  }
  if (lower === 'groups') return makeResult(root ? 'root' : user === 'devuser' ? 'devuser sudo' : 'student users', next);
  if (lower === 'hostname') return makeResult(TARGET_HOST, next);
  if (lower === 'uname -a') return makeResult('Linux codenest-ubuntu 5.15.0-126-generic #136-Ubuntu SMP x86_64 GNU/Linux', next);
  if (lower === 'cat /etc/os-release') return makeResult('PRETTY_NAME="Ubuntu 22.04.5 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"\nVERSION="22.04.5 LTS (Jammy Jellyfish)"', next);
  if (lower === 'pwd') return makeResult(c.cwd, next);
  if (lower === 'cd' || lower === 'cd ~') {
    c.cwd = `/home/${user}`;
    return makeResult('', next);
  }
  if (lower.startsWith('cd ')) {
    const requested = command.slice(3).trim().replace(/^['"]|['"]$/g, '');
    const destination = normalizePath(c.cwd, requested);
    const knownDirectories = new Set([
      '/', '/home', '/home/student', '/home/devuser', '/home/devuser/data',
      '/home/student/.config', '/home/student/.config/system',
      '/home/student/.config/system/.cache', '/home/student/.config/system/.cache/tmp',
      '/home/student/.config/system/.cache/tmp/.hidden', '/opt', '/opt/codenest',
      '/etc', '/etc/cron.d', '/etc/sudoers.d', '/usr', '/usr/local', '/usr/local/bin',
      '/tmp', '/root', '/var', '/var/log'
    ]);
    if (!knownDirectories.has(destination)) return makeResult(`bash: cd: ${requested}: No such file or directory`, next);
    if (destination === '/root' && !root) return makeResult('bash: cd: /root: Permission denied', next);
    if (destination.startsWith('/home/student/.config') && user !== 'student' && !root) return makeResult(`bash: cd: ${requested}: Permission denied`, next);
    c.cwd = destination;
    return makeResult('', next);
  }

  if (lower === 'ls' || lower === 'ls -la' || lower === 'ls -l' || lower === 'ls -lah' || lower.startsWith('ls -la ') || lower.startsWith('ls -l ')) {
    const match = command.match(/^ls\s+(?:-[a-zA-Z]+\s+)?(.+)$/);
    const requested = match ? match[1].replace(/^['"]|['"]$/g, '') : c.cwd;
    const target = requested.startsWith('/') ? requested.replace(/\/$/, '') : path.posix.join(c.cwd, requested);
    if (target.includes('/../') && !root) return makeResult('ls: cannot access: Permission denied', next);
    if (target.startsWith('/root') && !root) return makeResult(`ls: cannot open directory '${target}': Permission denied`, next);
    const fileListings = {
      '/opt/codenest/backup.sh': '-rw-r--r-- 1 root root 154 Nov  8 17:51 /opt/codenest/backup.sh',
      '/opt/codenest/cleanup.sh': '-rw-rw-rw- 1 root root 52 Nov  8 17:52 /opt/codenest/cleanup.sh',
      '/opt/codenest/Flag2.txt': '-rw------- 1 devuser devuser 58 Nov  8 17:48 /opt/codenest/Flag2.txt',
      '/usr/local/bin/backup_tool': '-rwsr-xr-x 1 root root 16016 Nov  8 17:54 /usr/local/bin/backup_tool',
      '/root/Flag3.txt': root ? '-rw------- 1 root root 94 Nov  8 17:55 /root/Flag3.txt' : null
    };
    if (Object.prototype.hasOwnProperty.call(fileListings, target)) {
      return makeResult(fileListings[target] || `ls: cannot access '${target}': Permission denied`, next);
    }
    return makeResult(targetListing(target, user), next);
  }

  if (lower === 'cat /etc/passwd' || lower === 'getent passwd') {
    return makeResult('root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nmessagebus:x:102:106::/nonexistent:/usr/sbin/nologin\nstudent:x:1001:1001:Student:/home/student:/bin/bash\ndevuser:x:1002:1002:Developer:/home/devuser:/bin/bash', next);
  }
  if (lower === 'cat /etc/group') return makeResult('root:x:0:\nsudo:x:27:devuser\nusers:x:100:student', next);
  if (lower === 'cat /etc/hostname') return makeResult(TARGET_HOST, next);
  if (lower === 'cat /etc/hosts') return makeResult('127.0.0.1 localhost\n127.0.1.1 codenest-ubuntu\n192.168.56.10 kali-codenest', next);
  if (lower === 'env' || lower === 'printenv') return makeResult(`SHELL=/bin/bash\nUSER=${user}\nHOME=${user === 'root' ? '/root' : `/home/${user}`}\nLANG=C.UTF-8\nPATH=${c.pathHijackActive ? '/tmp/hijack:' : ''}/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, next);
  if (lower === 'ps aux') return makeResult('USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot           1  0.0  0.1 168500 11232 ?        Ss   17:40   0:02 /sbin/init\nroot         522  0.0  0.1  14520  3200 ?        Ss   17:40   0:00 /usr/sbin/cron -f\nroot         611  0.0  0.1  15432  4800 ?        Ss   17:41   0:00 /usr/sbin/sshd -D\nstudent      901  0.0  0.0   8224  3900 pts/0    Ss   17:58   0:00 -bash', next);
  if (lower === 'ss -tulpn' || lower === 'ss -tulpen' || lower === 'netstat -tulpn') return makeResult('Netid State  Local Address:Port Process\ntcp   LISTEN 0.0.0.0:22    users:(("sshd",pid=611,fd=3))\ntcp   LISTEN 127.0.0.1:3306 users:(("mysqld",pid=704,fd=21))', next);
  if (lower === 'systemctl status cron' || lower === 'service cron status') return makeResult('● cron.service - Regular background program processing daemon\n     Loaded: loaded (/lib/systemd/system/cron.service; enabled; vendor preset: enabled)\n     Active: active (running) since Sun 2026-11-08 17:40:12 UTC; 32min ago', next);
  if (lower === 'crontab -l') return makeResult('no crontab for ' + user, next);
  if (lower === 'sudo -v') return makeResult('sudo: a password is required (unless a matching NOPASSWD rule applies)', next);
  if (lower === 'sudo -l' || lower === 'sudo -n -l') {
    if (user !== 'devuser' && !root) return makeResult(`${user} is not in the sudoers file. This incident will be reported.`, next);
    c.sudoInspected = true;
    return makeResult('Matching Defaults entries for devuser on codenest-ubuntu:\n    env_reset, mail_badpass, secure_path=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n\nUser devuser may run the following commands on codenest-ubuntu:\n    (ALL) NOPASSWD: /usr/bin/find', next);
  }

  // Discovery of the deliberately hidden first flag.
  if (/^find\s+\/\s+-iname\s+["']?flag1\.txt["']?/.test(lower)) {
    if (user !== 'student' && !root) return makeResult('find: \'/home/student/.config\': Permission denied\nNo matching files found.', next);
    c.flag1Located = true;
    return makeResult(`${STUDENT_FLAG_PATH}\nfind: ‘/proc/611/task’: Permission denied (omitted)`, next);
  }
  if (lower === `cat ${STUDENT_FLAG_PATH.toLowerCase()}` || lower === 'cat flag1.txt' && c.cwd.endsWith('/.hidden')) {
    if (user !== 'student' && !root) return makeResult(`cat: ${STUDENT_FLAG_PATH}: Permission denied`, next);
    if (!root && !c.flag1Located && lower === 'cat flag1.txt') return makeResult('cat: Flag1.txt: No such file or directory', next);
    c.flag1Read = true;
    return makeResult('Tabriklaymiz, 1-flagni topdingiz! Davom eting...', next);
  }

  if (lower === 'cat /opt/codenest/backup.sh' || lower === 'cat backup.sh' && c.cwd === '/opt/codenest') {
    if (!['student', 'devuser', 'root'].includes(user)) return makeResult('cat: Permission denied', next);
    c.backupInspected = true;
    return makeResult('#!/bin/bash\nDEVUSER_PASS="D3vUser_B@ckup2024"\nrsync -az /home/devuser/data /mnt/backup/ 2>/dev/null', next);
  }
  if (lower === 'grep -n devuser_pass /opt/codenest/backup.sh' || lower === 'grep devuser_pass /opt/codenest/backup.sh') {
    if (!['student', 'devuser', 'root'].includes(user)) return makeResult('grep: Permission denied', next);
    c.backupInspected = true;
    return makeResult('2:DEVUSER_PASS="D3vUser_B@ckup2024"', next);
  }
  if (lower === 'su devuser') {
    if (user !== 'student') return makeResult('su: user devuser is already active or this transition is not available from the current account.', next);
    if (!c.flag1Read) return makeResult('su: key information is missing. Find and read Flag1.txt before moving laterally.', next);
    if (!c.backupInspected) return makeResult('su: password for devuser is not known yet. Inspect the readable /opt/codenest/backup.sh file first.', next);
    c.pendingAuth = 'devuser';
    return makeResult('Password:', next);
  }
  if (lower === 'su root' || lower === 'sudo -i' || lower === 'sudo su') return makeResult(`${user} is not permitted to switch directly to root. Inspect the lab's documented privilege paths.`, next);

  // Flag 2 is restricted to devuser (mode 0600).
  if (lower === `cat ${DEVUSER_FLAG_PATH.toLowerCase()}` || lower === 'cat flag2.txt' && c.cwd === '/opt/codenest') {
    if (user !== 'devuser' && !root) return makeResult(`cat: ${DEVUSER_FLAG_PATH}: Permission denied`, next);
    c.flag2Read = true;
    markObjective(next, 1);
    return makeResult('Tabriklaymiz, 2-flagni topdingiz! Root tomon davom eting...', next);
  }

  if (lower === 'cat /etc/cron.d/codenest-cleanup' || lower === 'cat codenest-cleanup' && c.cwd === '/etc/cron.d') {
    if (user !== 'devuser' && !root) return makeResult('cat: /etc/cron.d/codenest-cleanup: Permission denied', next);
    c.cronInspected = true;
    return makeResult('# /etc/cron.d/codenest-cleanup\n# Script mode is 0666, so cron invokes it explicitly through bash.\n*/2 * * * * root /bin/bash /opt/codenest/cleanup.sh', next);
  }
  if (lower === 'cat /opt/codenest/cleanup.sh' || lower === 'cat cleanup.sh' && c.cwd === '/opt/codenest') {
    if (user !== 'devuser' && !root) return makeResult('cat: Permission denied', next);
    return makeResult(c.cronPayloadInstalled ? '#!/bin/bash\nchmod +s /bin/bash' : '#!/bin/bash\nfind /tmp -type f -mtime +1 -delete', next);
  }
  if (lower === 'stat /opt/codenest/cleanup.sh' || lower === 'stat cleanup.sh' && c.cwd === '/opt/codenest') {
    return makeResult('  File: /opt/codenest/cleanup.sh\n  Size: 52              Blocks: 8          IO Block: 4096   regular file\nDevice: 8,1   Inode: 262184      Links: 1\nAccess: (0666/-rw-rw-rw-)  Uid: ( 0/ root)   Gid: ( 0/ root)\nAccess: 2026-11-08 17:52:00.000000000 +0000', next);
  }

  // The cron payload is written into the virtual target filesystem only.
  const echoRedirect = command.match(/^echo\s+(['"])(.*?)\1\s*>\s*(\S+)$/i);
  if (echoRedirect) {
    const payload = echoRedirect[2];
    const destination = echoRedirect[3].replace(/^['"]|['"]$/g, '');
    if (destination === CLEANUP_SCRIPT) {
      if (user !== 'devuser' && !root) return makeResult(`bash: ${destination}: Permission denied`, next);
      if (!c.flag2Read && !root) return makeResult('Avval Flag2 bosqichini tugating.', next);
      if (!c.cronInspected && !root) return makeResult('Avval /etc/cron.d/codenest-cleanup faylini tekshirib, root cron job ushbu skriptni chaqirishini aniqlang.', next);
      if (payload.trim() === 'chmod +s /bin/bash' || payload.trim() === '#!/bin/bash; chmod +s /bin/bash') {
        c.cronPayloadInstalled = true;
        return makeResult(`[virtual FS] ${destination} overwritten (owner root:root, mode 0666). Next scheduled cron tick will process it.`, next);
      }
      return makeResult('[virtual FS] Script content accepted only for the lab’s documented chmod +s /bin/bash demonstration payload.', next);
    }
    if (destination === '/tmp/hijack/chmod') {
      if (user !== 'devuser' && !root) return makeResult(`bash: ${destination}: Permission denied`, next);
      if (payload.includes('/bin/chmod +s /bin/bash')) {
        c.pathHelperCreated = true;
        return makeResult('[virtual FS] PATH helper created at /tmp/hijack/chmod. It calls /bin/chmod by absolute path, avoiding recursion.', next);
      }
    }
    return makeResult(`bash: ${destination}: virtual redirection target is not writable or supported.`, next);
  }

  if (lower === 'mkdir -p /tmp/hijack' || lower === 'mkdir /tmp/hijack') {
    if (user !== 'devuser' && !root) return makeResult('mkdir: cannot create directory \'/tmp/hijack\': Permission denied', next);
    return makeResult('mkdir: created directory \'/tmp/hijack\' (virtual filesystem)', next);
  }
  if (lower === 'chmod +x /tmp/hijack/chmod') {
    if (!c.pathHelperCreated) return makeResult('chmod: cannot access \'/tmp/hijack/chmod\': No such file or directory', next);
    c.pathHelperExecutable = true;
    return makeResult('', next);
  }
  if (lower === 'export path=/tmp/hijack:$path' || lower === 'export path=/tmp/hijack:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin') {
    if (!c.pathHelperExecutable) return makeResult('bash: PATH helper executable emas. Avval helper faylini tayyorlang.', next);
    c.pathHijackActive = true;
    return makeResult('PATH=/tmp/hijack:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', next);
  }
  if (lower === 'type chmod' || lower === 'which chmod') {
    return makeResult(c.pathHijackActive ? '/tmp/hijack/chmod' : '/usr/bin/chmod', next);
  }

  // Cron runs on a virtual clock: sleep 120 advances the lab clock, not wall time.
  const sleepMatch = lower.match(/^sleep\s+(\d+)$/);
  if (sleepMatch) {
    const seconds = Math.min(Number(sleepMatch[1]), 600);
    if (!Number.isFinite(seconds) || seconds < 1) return makeResult('sleep: invalid time interval', next);
    c.virtualSeconds += seconds;
    if (c.cronPayloadInstalled && !c.cronTriggered && c.virtualSeconds >= 120) {
      c.cronTriggered = true;
      c.bashSuid = true;
      return makeResult(`\n[cron] (root) CMD (/bin/bash ${CLEANUP_SCRIPT})\n[cron] cleanup.sh completed successfully\n[cron] /bin/bash permissions changed to -rwsr-xr-x (4755)\nVirtual clock advanced by ${seconds}s. No real sleep or host process was started.`, next);
    }
    return makeResult(`Virtual lab clock advanced by ${seconds}s. Total simulated time: ${c.virtualSeconds}s.`, next);
  }

  if (lower === 'find / -perm -4000 2>/dev/null' || lower === 'find / -type f -perm -4000 2>/dev/null' || lower === 'find / -perm -u=s 2>/dev/null') {
    if (user !== 'devuser' && !root && user !== 'student') return makeResult('find: permission denied', next);
    c.suidInspected = true;
    return makeResult('/usr/bin/passwd\n/usr/bin/sudo\n/usr/bin/mount\n/usr/bin/chsh\n/usr/bin/gpasswd\n/usr/local/bin/backup_tool\n\nSUID candidate: /usr/local/bin/backup_tool (root:root, mode 4755)', next);
  }
  if (lower === 'cat /opt/codenest/backup_tool.c' || lower === 'cat backup_tool.c' && c.cwd === '/opt/codenest') {
    if (user !== 'devuser' && !root) return makeResult('cat: Permission denied', next);
    c.suidInspected = true;
    return makeResult('#include <stdlib.h>\nint main() {\n    system("/bin/cp /etc/shadow /tmp/shadow_copy && chmod 644 /tmp/shadow_copy");\n    return 0;\n}', next);
  }
  if (lower === 'ls -l /usr/local/bin/backup_tool' || lower === 'stat /usr/local/bin/backup_tool') {
    c.suidInspected = true;
    return makeResult('-rwsr-xr-x 1 root root 16016 Nov  8 17:54 /usr/local/bin/backup_tool\nAccess: (4755/-rwsr-xr-x)  Uid: (0/root) Gid: (0/root)', next);
  }
  if (lower === SUID_TOOL || lower === 'backup_tool') {
    if (!c.flag2Read && user !== 'root') return makeResult('Avval Flag2 bosqichini tugating.', next);
    if (!c.suidInspected && user !== 'root') return makeResult('backup_tool: SUID candidate hali tekshirilmagan. Avval find / -perm -4000 2>/dev/null bajaring.', next);
    c.backupToolExecuted = true;
    if (c.pathHijackActive && c.pathHelperExecutable && c.pathHelperCreated && user === 'devuser') {
      c.bashSuid = true;
      return makeResult('backup_tool: /bin/cp /etc/shadow /tmp/shadow_copy [OK]\nbackup_tool: invoking chmod via PATH=/tmp/hijack first\n/tmp/hijack/chmod executed with effective UID 0\n[virtual FS] /bin/bash mode changed to 4755 (-rwsr-xr-x)\nPATH hijack chain completed in the isolated CodeNest filesystem.', next);
    }
    return makeResult('backup_tool: /tmp/shadow_copy created (mode 0644).\nSUID binary completed, but no PATH helper intercepted chmod. Inspect the system() command and the PATH lookup behavior.', next);
  }

  if (lower === 'bash -p' || lower === '/bin/bash -p') {
    if (!c.bashSuid && !root) return makeResult('bash: cannot preserve effective UID: /bin/bash SUID bit is not set in this virtual target.', next);
    next.elevated = true;
    c.currentUser = 'root';
    c.cwd = '/root';
    c.rootVia = c.cronTriggered ? 'cron' : 'suid-path';
    markObjective(next, 2);
    return makeResult('bash-5.1# Effective UID: 0 (root)\nPrivileged shell opened by the virtual SUID bash binary.', next);
  }

  // Sudoers GTFOBins route: only the exact find command whitelisted for devuser.
  if (/^sudo\s+(?:\/usr\/bin\/)?find\s+\.\s+-exec\s+\/bin\/(?:ba)?sh(?:\s+-p)?\s+(?:\\;|;)\s+-quit$/.test(lower)) {
    if (user !== 'devuser' && !root) return makeResult('sudo: a password is required or user is not authorized for /usr/bin/find', next);
    if (!c.flag2Read && !root) return makeResult('Avval /opt/codenest/Flag2.txt faylini o‘qib, devuser bosqichini yakunlang.', next);
    if (!c.sudoInspected && !root) return makeResult('Avval sudo -l orqali NOPASSWD: /usr/bin/find ruxsatini tekshiring.', next);
    next.elevated = true;
    c.currentUser = 'root';
    c.cwd = '/root';
    c.rootVia = 'sudo-find';
    markObjective(next, 2);
    return makeResult('find: privilege boundary crossed (SIMULATED)\n# Effective UID: 0 (root)\nVirtual root shell opened. Host OS’da buyruq bajarilmadi.', next);
  }
  if (lower.startsWith('sudo ') && /\bfind\b/.test(lower) && lower.includes('-exec')) {
    return makeResult('sudo: bu labda ruxsat berilgan binary /usr/bin/find. Sintaksisni tekshiring: sudo find . -exec /bin/sh \\; -quit', next);
  }

  if (lower === 'cat /etc/shadow') return makeResult(root ? 'root:$y$j9T$SIMULATED_HASH:20500:0:99999:7:::\nstudent:$y$j9T$STUDENT_HASH:20500:0:99999:7:::\ndevuser:$y$j9T$DEVUSER_HASH:20500:0:99999:7:::' : 'cat: /etc/shadow: Permission denied', next);
  if (lower === 'cat /tmp/shadow_copy') return makeResult(c.backupToolExecuted ? 'root:$y$j9T$SIMULATED_HASH:20500:0:99999:7:::\nstudent:$y$j9T$STUDENT_HASH:20500:0:99999:7:::\ndevuser:$y$j9T$DEVUSER_HASH:20500:0:99999:7:::' : 'cat: /tmp/shadow_copy: No such file or directory', next);

  if (lower === `cat ${ROOT_FLAG_PATH.toLowerCase()}` || lower === 'cat flag3.txt' && c.cwd === '/root') {
    if (!root) return makeResult(`cat: ${ROOT_FLAG_PATH}: Permission denied`, next);
    markObjective(next, 2);
    markObjective(next, 3);
    return makeResult(`Tabriklaymiz! Siz root huquqini oldingiz va stsenariyni muvaffaqiyatli yakunladingiz.\n${expectedFlag(sessionId, lab.slug)}`, next);
  }
  if (lower === 'ls -l /root/flag3.txt' || lower === 'stat /root/Flag3.txt'.toLowerCase()) {
    return makeResult(root ? '-rw------- 1 root root 94 Nov  8 17:55 /root/Flag3.txt' : 'ls: cannot access \'/root/Flag3.txt\': Permission denied', next);
  }
  if (lower.startsWith('cat ')) {
    const file = command.slice(4).trim().replace(/^['"]|['"]$/g, '');
    if (file.startsWith('/root/') && !root) return makeResult(`cat: ${file}: Permission denied`, next);
    return makeResult(`cat: ${file}: No such file or permission denied`, next);
  }
  if (lower.startsWith('grep ')) {
    if (lower.includes('devuser_pass') && lower.includes('backup.sh')) {
      c.backupInspected = true;
      return makeResult('2:DEVUSER_PASS="D3vUser_B@ckup2024"', next);
    }
    if (lower.includes('nopasswd') && lower.includes('sudoers')) return makeResult('devuser ALL=(ALL) NOPASSWD: /usr/bin/find', next);
    return makeResult('grep: no matching lines found in the virtual target dataset', next);
  }
  if (lower === 'getcap -r / 2>/dev/null') return makeResult('/usr/bin/ping cap_net_raw=ep', next);
  if (lower === 'df -h') return makeResult('Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2        40G   11G   27G  29% /', next);
  if (lower === 'free -h') return makeResult('               total        used        free      shared  buff/cache   available\nMem:           3.8Gi       612Mi       2.1Gi        24Mi       1.1Gi       3.0Gi\nSwap:          2.0Gi          0B       2.0Gi', next);
  if (lower === 'which find' || lower === 'whereis find') return makeResult('find: /usr/bin/find /usr/share/man/man1/find.1.gz', next);
  if (lower === 'which sudo') return makeResult('sudo: /usr/bin/sudo', next);
  if (lower === 'which rsync') return makeResult('rsync: /usr/bin/rsync', next);
  if (lower === 'file /usr/local/bin/backup_tool') return makeResult('/usr/local/bin/backup_tool: ELF 64-bit LSB pie executable, x86-64, dynamically linked, setuid root', next);
  if (lower === 'date') return makeResult(`Sun Nov  8 18:${String(2 + Math.floor(c.virtualSeconds / 60)).padStart(2, '0')}:11 UTC 2026 (virtual lab clock)`, next);

  if (lower.startsWith('find ')) {
    if (lower.includes('cleanup.sh')) return makeResult(CLEANUP_SCRIPT, next);
    if (lower.includes('backup_tool')) { c.suidInspected = true; return makeResult(SUID_TOOL, next); }
    return makeResult('find: no additional matches in the CodeNest virtual filesystem. Use the specified paths and permission flags.', next);
  }
  if (lower.startsWith('chmod ')) {
    if (lower.includes('/opt/codenest/cleanup.sh')) return makeResult('chmod: changing permissions of \'/opt/codenest/cleanup.sh\': Operation not permitted (owner is root). The file is already writable by all users (0666).', next);
    return makeResult(`chmod: '${command.split(/\s+/).pop()}': operation not supported by the virtual filesystem`, next);
  }

  return makeResult(`bash: ${command.split(/\s+/)[0]}: command not found or unsupported in CodeNest virtual Ubuntu. Type 'help' for supported commands.`, next);
}

module.exports = { executeCodenestCommand, promptForCodenest, TARGET_IP, STUDENT_FLAG_PATH, DEVUSER_FLAG_PATH, ROOT_FLAG_PATH };
