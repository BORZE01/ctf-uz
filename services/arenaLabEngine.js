const crypto = require('crypto');
const path = require('path');
const { executeCodenestCommand, promptForCodenest } = require('./codenestLinuxEngine');

const LABS = Object.freeze({
  'linux-privesc': {
    slug: 'linux-privesc', title: 'Linux PrivEsc', category: 'Linux', difficulty: 'Beginner',
    points: 250, durationMinutes: 60, os: 'Ubuntu 22.04 target', attackBox: 'Kali Linux terminal',
    target: '10.10.10.10', skill: 'linux',
    description: 'Linux tizimini tekshiring, sudo noto‘g‘ri konfiguratsiyasini toping va laboratoriya targetida root darajasiga chiqing.',
    objectives: ['Target mashinaga ulaning', 'Foydalanuvchi va sudo ruxsatlarini tekshiring', 'Noto‘g‘ri sozlangan find ruxsatidan foydalaning', 'Root flagni o‘qing va topshiring'],
    connectionCommand: 'ssh trainee@10.10.10.10'
  },
  'codenest-linux-privesc': {
    slug: 'codenest-linux-privesc', title: 'CodeNest LinuxPrivEsc Lab', category: 'Linux', difficulty: 'Intermediate',
    points: 400, durationMinutes: 75, os: 'Ubuntu Server 22.04.5 LTS (x86_64)', attackBox: 'Kali Linux (Host-only simulation)',
    target: '192.168.56.101', skill: 'linux',
    description: 'Nmap bilan targetni aniqlang, SSH credential audit qiling, student → devuser lateral movement bajaring va sudo find, writable cron yoki SUID PATH hijack yo‘llaridan biri bilan root flagni oling. To‘liq izolyatsiyalangan virtual terminal simulyatsiyasi.',
    objectives: [
      '192.168.56.0/24 tarmog‘ini skanerlang, SSH 22/tcp servis versiyasini aniqlang va student sifatida targetga kiring',
      'Flag1.txt faylini find bilan toping, backup.sh ichidagi credentialni aniqlang, su orqali devuser’ga o‘ting va Flag2’ni o‘qing',
      'sudo find, 2 daqiqalik writable cron yoki backup_tool SUID PATH hijack yo‘llaridan biri orqali root huquqini oling',
      '/root/Flag3.txt faylini o‘qing va dinamik flagni topshiring'
    ],
    connectionCommand: 'nmap 192.168.56.0/24'
  },
  'windows-privesc': {
    slug: 'windows-privesc', title: 'Windows PrivEsc', category: 'Windows', difficulty: 'Intermediate',
    points: 300, durationMinutes: 60, os: 'Windows Server target', attackBox: 'Kali Linux terminal',
    target: '10.10.20.10', skill: 'blue',
    description: 'Windows servis konfiguratsiyasi va fayl ACL ruxsatlarini audit qilib, laboratoriya muhitida SYSTEM darajasiga chiqing.',
    objectives: ['Windows targetga RDP laboratoriya ulanishini oching', 'Joriy token va servisni tekshiring', 'Zaif servis konfiguratsiyasini aniqlang', 'Servis qayta ishga tushganda SYSTEM darajasini oling va flagni topshiring'],
    connectionCommand: 'xfreerdp /v:10.10.20.10 /u:trainee'
  },
  'uac-bypass': {
    slug: 'uac-bypass', title: 'Windows UAC Bypass', category: 'Windows', difficulty: 'Advanced',
    points: 350, durationMinutes: 60, os: 'Windows 11 target', attackBox: 'Kali Linux terminal',
    target: '10.10.30.10', skill: 'blue',
    description: 'UAC auto-elevation konfiguratsiyasidagi zaiflikni laboratoriya ichida tahlil qiling. Simulyatsiya High Integrity token beradi, SYSTEM emas.',
    objectives: ['Windows targetga ulang', 'Joriy integrity levelni aniqlang', 'ms-settings handler va DelegateExecute qiymatlarini sozlang', 'fodhelper simulyatsiyasini ishga tushiring va flagni o‘qing'],
    connectionCommand: 'xfreerdp /v:10.10.30.10 /u:trainee'
  }
});

function expectedFlag(sessionId, slug) {
  const secret = process.env.ARENA_FLAG_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('ARENA_FLAG_SECRET yoki kuchli SESSION_SECRET sozlanmagan');
  const token = crypto.createHmac('sha256', secret).update(`${sessionId}:${slug}`).digest('hex').slice(0, 18);
  return `CTFUZ{${slug.replace(/-/g, '_')}_${token}}`;
}

function promptFor(lab, state) {
  if (lab.slug === 'codenest-linux-privesc') return promptForCodenest(state);
  if (!state.connected) return 'kali@ctfuz:~$';
  if (lab.slug === 'linux-privesc') {
    const user = state.elevated ? 'root' : 'trainee';
    const cwd = state.cwd || (state.elevated ? '/root' : '/home/trainee');
    const shown = cwd === `/home/${user}` ? '~' : cwd;
    return `${user}@linux-target:${shown}${state.elevated ? '#' : '$'}`;
  }
  const winCwd = state.cwd || 'C:\\Users\\trainee';
  if (lab.slug === 'uac-bypass') return state.elevated ? `WIN-TARGET\\trainee (High Integrity) ${winCwd}>` : `WIN-TARGET\\trainee ${winCwd}>`;
  return state.elevated ? `NT AUTHORITY\\SYSTEM ${winCwd}>` : `WIN-TARGET\\trainee ${winCwd}>`;
}

function markObjective(state, index) {
  state.objectivesCompleted = Array.isArray(state.objectivesCompleted) ? state.objectivesCompleted : [false, false, false, false];
  while (state.objectivesCompleted.length < 4) state.objectivesCompleted.push(false);
  state.objectivesCompleted[index] = true;
}

function normalizeVirtualPath(current, requested, elevated) {
  const base = requested.startsWith('/') ? requested : path.posix.join(current || '/home/trainee', requested || '.');
  const resolved = path.posix.normalize(base);
  const allowed = new Set(['/','/home','/home/trainee','/root','/tmp','/var','/var/log','/etc','/usr','/usr/bin','/opt','/var/www']);
  if (resolved === '/root' || resolved.startsWith('/root/')) {
    if (!elevated) return { error: 'bash: cd: /root: Permission denied' };
  }
  if (!allowed.has(resolved) && !resolved.startsWith('/home/trainee/')) return { error: `bash: cd: ${requested}: No such file or directory` };
  return { path: resolved };
}


function normalizeWindowsVirtualPath(current, requested) {
  let target = String(requested || '').trim();
  target = target.replace(/^(?:\/d|\\d)\s+/i, '');
  target = target.replace(/^"|"$/g, '').replace(/\//g, '\\');
  if (!target) return { path: current || 'C:\\Users\\trainee' };
  const base = current || 'C:\\Users\\trainee';
  let resolved;
  if (/^[a-z]:\\/i.test(target)) resolved = path.win32.normalize(target);
  else if (target.startsWith('\\')) resolved = path.win32.resolve('C:\\', '.' + target);
  else resolved = path.win32.resolve(base, target);
  const known = [
    'C:\\', 'C:\\Users', 'C:\\Users\\trainee',
    'C:\\Users\\trainee\\Desktop', 'C:\\Users\\trainee\\Documents', 'C:\\Users\\trainee\\Downloads',
    'C:\\Users\\Administrator', 'C:\\Users\\Administrator\\Desktop',
    'C:\\Program Files', 'C:\\Program Files\\VulnSvc',
    'C:\\ProgramData', 'C:\\ProgramData\\Microsoft', 'C:\\ProgramData\\VulnSvc',
    'C:\\Windows', 'C:\\Windows\\System32', 'C:\\Windows\\Temp'
  ];
  const canonical = known.find(item => item.toLowerCase() === resolved.toLowerCase());
  if (!canonical) return { error: `The system cannot find the path specified: ${target}` };
  return { path: canonical };
}

function windowsDirectoryListing(cwd) {
  const dir = String(cwd || 'C:\\Users\\trainee').toLowerCase();
  if (dir === 'c:\\users\\trainee\\desktop') return ' Directory of C:\\Users\\trainee\\Desktop\n.  ..\nreadme.txt  task-notes.txt';
  if (dir === 'c:\\users\\trainee\\documents') return ' Directory of C:\\Users\\trainee\\Documents\n.  ..\nwelcome.txt  inventory.txt';
  if (dir === 'c:\\users\\trainee\\downloads') return ' Directory of C:\\Users\\trainee\\Downloads\n.  ..\nVulnSvc-Inspector.exe  checksum.txt';
  if (dir === 'c:\\program files\\vulnsvc') return ' Directory of C:\\Program Files\\VulnSvc\n.  ..\nservice.exe  config.ini';
  if (dir === 'c:\\programdata') return ' Directory of C:\\ProgramData\n.  ..\nMicrosoft  VulnSvc';
  if (dir === 'c:\\programdata\\vulnsvc') return ' Directory of C:\\ProgramData\\VulnSvc\n.  ..\nroot.txt (access restricted)';
  if (dir === 'c:\\windows\\system32') return ' Directory of C:\\Windows\\System32\ncmd.exe  fodhelper.exe  WindowsPowerShell\\';
  if (dir === 'c:\\windows\\temp') return ' Directory of C:\\Windows\\Temp\n.  ..\n';
  if (dir === 'c:\\users\\administrator\\desktop') return ' Directory of C:\\Users\\Administrator\\Desktop\nflag.txt (access restricted)';
  if (dir === 'c:\\') return ' Directory of C:\nUsers  Program Files  ProgramData  Windows  Temp';
  if (dir === 'c:\\users') return ' Directory of C:\\Users\nAdministrator  trainee';
  if (dir === 'c:\\windows') return ' Directory of C:\\Windows\nSystem32  Temp';
  return ' Directory of C:\\Users\\trainee\nDesktop  Documents  Downloads  NTUSER.DAT';
}

function windowsHelp() {
  return [
    'Windows CMD: help, cls, history, pwd, cd, dir, type, whoami, whoami /all, hostname, systeminfo, ver, ipconfig, route print, ping, netstat -ano, tasklist, net user, net localgroup administrators.',
    'Service audit: sc query, sc qc VulnSvc, sc config VulnSvc, sc start VulnSvc, get-service, icacls "C:\\Program Files\\VulnSvc\\service.exe".',
    'Fayllar: type <file>, cat <file> (matnli fayllar uchun alias). Registry: reg query, reg add. Kali tarmoq buyruqlari RDP ulanishidan oldin ishlatiladi.'
  ].join('\n');
}

function linuxFindEscalation(lower) {
  // Only this room's documented sudoers misconfiguration is simulated.
  const allowedBinary = /^sudo\s+(?:\/usr\/bin\/)?find(?:\s|$)/.test(lower);
  const execShell = /-exec\s+\/bin\/sh\b/.test(lower);
  const preservePriv = /\s-p(?:\s|$)/.test(lower);
  const hasTerminator = /\\;|\s\+\s*$/.test(lower);
  return allowedBinary && execShell && preservePriv && hasTerminator && !lower.includes('-execdir');
}

function executeLabCommand(lab, sessionId, state, rawCommand) {
  const command = String(rawCommand || '').trim().replace(/\s+/g, ' ');
  const lower = command.toLowerCase();
  const next = { ...state, objectivesCompleted: [...(state.objectivesCompleted || [false, false, false, false])] };
  while (next.objectivesCompleted.length < 4) next.objectivesCompleted.push(false);
  if (!command) return { output: '', state: next, prompt: promptFor(lab, next) };
  if (command.length > 180) return { output: 'Xato: buyruq 180 belgidan oshmasligi kerak.', state: next, prompt: promptFor(lab, next) };
  if (/\u0000|[\r\n]/.test(command)) return { output: 'Xato: bitta buyruq yuboring.', state: next, prompt: promptFor(lab, next) };
  if (lab.slug === 'codenest-linux-privesc') {
    return executeCodenestCommand(lab, sessionId, state, command, expectedFlag);
  }

  const local = {
    help: 'Kali: help, clear, history, pwd, ls, cd, whoami, hostname, ip a, ip route, ping, nmap, ssh yoki xfreerdp.\nLinux target: id, uname -a, cat, grep, find, sudo -l, getcap, ps aux, ss -tulpn.\nWindows target: whoami /all, systeminfo, dir, type, sc qc, sc config, sc start, icacls, reg query, reg add, start fodhelper.exe.',
    'ip a': 'eth0: 10.10.0.5/24  UP  (isolated lab network)\nlo: 127.0.0.1/8',
    'ip addr': 'eth0: 10.10.0.5/24  UP  (isolated lab network)\nlo: 127.0.0.1/8',
    'ip route': '10.10.0.0/24 dev eth0 proto kernel scope link\n10.10.10.0/24 via 10.10.0.1 dev eth0',
    pwd: '/home/kali', whoami: 'kali', hostname: 'ctfuz-kali',
    'ls': 'Desktop  Documents  Downloads  lab-notes.txt',
    'ls -la': 'drwxr-xr-x  5 kali kali 4096 .\ndrwxr-xr-x 18 root root 4096 ..\n-rw-r--r--  1 kali kali  220 lab-notes.txt',
    'cat lab-notes.txt': `Target: ${lab.target}\nUlanish: ${lab.connectionCommand}\nMaqsad: lab ichidagi flagni topish.`,
    'which nmap': '/usr/bin/nmap', 'which ssh': '/usr/bin/ssh', 'which python3': '/usr/bin/python3',
    'uname -a': 'Linux ctfuz-kali 6.8.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
    'cat /etc/os-release': 'PRETTY_NAME=\"Kali GNU/Linux Rolling\"\nID=kali\nVERSION_ID=2026.1',
    'ip link': '1: lo: <LOOPBACK,UP> mtu 65536\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500'
  };
  if (lower === 'help' && !next.connected) return { output: local.help, state: next, prompt: promptFor(lab, next) };
  if (lower === 'clear' || lower === 'cls') return { output: '[CLEAR]', state: next, prompt: promptFor(lab, next) };
  if (lower === 'exit' && next.connected) {
    // Close only the interactive target shell. Target-side configuration and
    // completed objectives remain in the lab session, like a persistent room.
    next.connected = false;
    next.elevated = false;
    next.cwd = '/home/trainee';
    return { output: 'Target shell yopildi. Kali terminaliga qaytdingiz. Lab progressi, target konfiguratsiyasi va terminal tarixi saqlandi.', state: next, prompt: promptFor(lab, next) };
  }
  if (!next.connected && Object.prototype.hasOwnProperty.call(local, lower)) return { output: local[lower], state: next, prompt: promptFor(lab, next) };
  if (!next.connected && lower.startsWith('cat ')) return { output: lower === 'cat /etc/os-release' ? 'PRETTY_NAME="Kali GNU/Linux Rolling"\nID=kali\nVERSION_ID=2026.1' : 'cat: fayl topilmadi.', state: next, prompt: promptFor(lab, next) };
  if (lower.startsWith('ping ')) return { output: `PING ${lab.target}: 1 packets transmitted, 1 received, 0% packet loss\n64 bytes from ${lab.target}: icmp_seq=1 ttl=64 time=0.8 ms`, state: next, prompt: promptFor(lab, next) };
  if (lower.startsWith('nmap ')) return { output: `Starting Nmap 7.94 ( simulated )\nNmap scan report for ${lab.target}\nHost is up (0.0010s latency).\nPORT     STATE SERVICE\n22/tcp   open  ssh\n3389/tcp open  ms-wbt-server\nScan complete. (isolated training simulation)`, state: next, prompt: promptFor(lab, next) };

  if (!next.connected && lower === lab.connectionCommand.toLowerCase()) {
    next.connected = true; next.cwd = lab.slug === 'linux-privesc' ? '/home/trainee' : 'C:\\Users\\trainee';
    markObjective(next, 0);
    const welcome = lab.slug === 'linux-privesc'
      ? 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3\nLinux linux-target 5.15.0 (x86_64)\nKirish muvaffaqiyatli: trainee. Virtual labga ulandingiz; buyruqlar host OS da bajarilmaydi.'
      : 'RDP laboratoriya sessiyasi ochildi.\nWindows targetga trainee sifatida ulandingiz. Bu virtual lab; haqiqiy Windows host boshqarilmaydi.';
    return { output: welcome, state: next, prompt: promptFor(lab, next) };
  }
  if (!next.connected && (lower.startsWith('ssh ') || lower.startsWith('xfreerdp '))) return { output: `Ulanish rad etildi. Ushbu xona uchun buyruq: ${lab.connectionCommand}`, state: next, prompt: promptFor(lab, next) };
  if (!next.connected) return { output: 'Kali: buyruq topilmadi yoki targetga hali ulanmagansiz. `help`, `nmap` yoki target ulanish buyrug‘ini sinab ko‘ring.', state: next, prompt: promptFor(lab, next) };

  if (lab.slug === 'linux-privesc') {
    if (lower === 'whoami') return { output: next.elevated ? 'root' : 'trainee', state: next, prompt: promptFor(lab, next) };
    if (lower === 'id') { next.enumerated = true; markObjective(next, 1); return { output: next.elevated ? 'uid=0(root) gid=0(root) groups=0(root)' : 'uid=1001(trainee) gid=1001(trainee) groups=1001(trainee),27(sudo)', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'hostname') return { output: 'linux-target', state: next, prompt: promptFor(lab, next) };
    if (lower === 'pwd') return { output: next.cwd || '/home/trainee', state: next, prompt: promptFor(lab, next) };
    if (lower === 'cd' || lower === 'cd ~') { next.previousCwd = next.cwd; next.cwd = '/home/trainee'; return { output: '', state: next, prompt: promptFor(lab, next) }; }
    if (lower.startsWith('cd ')) {
      const target = command.slice(3).trim().replace(/^~(?=\/|$)/, '/home/trainee');
      const resolved = normalizeVirtualPath(next.cwd || '/home/trainee', target, next.elevated);
      if (resolved.error) return { output: resolved.error, state: next, prompt: promptFor(lab, next) };
      next.previousCwd = next.cwd; next.cwd = resolved.path;
      return { output: '', state: next, prompt: promptFor(lab, next) };
    }
    if (lower === 'ls' || lower === 'ls -la' || lower === 'ls -l' || lower === 'ls -lah') {
      const dir = next.cwd || '/home/trainee';
      if ((dir === '/root' || dir.startsWith('/root/')) && !next.elevated) return { output: 'ls: cannot open directory: Permission denied', state: next, prompt: promptFor(lab, next) };
      const listing = dir === '/root' ? 'total 16\ndrwx------  4 root root 4096 .\n-r-------- 1 root root   48 root.txt\n-rw------- 1 root root  220 .bash_history'
        : dir === '/home/trainee' ? 'total 20\ndrwxr-xr-x  5 trainee trainee 4096 .\n-rw-r--r--  1 trainee trainee  220 .bash_logout\n-rw-r--r--  1 trainee trainee  807 .profile\ndrwxr-xr-x  2 trainee trainee 4096 tools'
        : dir === '/usr/bin' ? '-rwxr-xr-x 1 root root 224848 find\n-rwxr-xr-x 1 root root 88456 sudo\n-rwxr-xr-x 1 root root 35200 python3'
        : dir === '/etc' ? 'passwd  group  hostname  os-release  sudoers.d/'
        : dir === '/var/log' ? 'auth.log  syslog  kern.log'
        : dir === '/tmp' ? 'systemd-private/  .X11-unix/'
        : 'total 8\ndrwxr-xr-x root root .\ndrwxr-xr-x root root ..';
      return { output: listing, state: next, prompt: promptFor(lab, next) };
    }
    if (lower === 'cat /etc/hosts') return { output: '127.0.0.1 localhost\n10.10.10.10 linux-target', state: next, prompt: promptFor(lab, next) };
    if (lower === 'cat /etc/sudoers.d/trainee') { next.enumerated = true; markObjective(next, 1); return { output: 'trainee ALL=(root) NOPASSWD: /usr/bin/find', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'env' || lower === 'printenv') return { output: 'SHELL=/bin/bash\nUSER=trainee\nHOME=/home/trainee\nLANG=C.UTF-8\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin', state: next, prompt: promptFor(lab, next) };
    if (lower === 'which find' || lower === 'whereis find') return { output: 'find: /usr/bin/find /usr/share/man/man1/find.1.gz', state: next, prompt: promptFor(lab, next) };
    if (lower === 'df -h') return { output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        20G  6.1G   13G  33% /', state: next, prompt: promptFor(lab, next) };
    if (lower === 'free -h') return { output: 'Mem:  1.9Gi  430Mi  1.1Gi  12Mi  380Mi  1.4Gi', state: next, prompt: promptFor(lab, next) };
    if (lower === 'sudo -V') return { output: 'Sudo version 1.9.9\nConfigure options: --with-secure-path', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('find / -name') || lower.startsWith('find / -iname')) return { output: '/home/trainee/user.txt\n/root/root.txt (permission restricted)', state: next, prompt: promptFor(lab, next) };
    if (lower === 'sudo -l' || lower === 'sudo -n -l') { next.enumerated = true; markObjective(next, 1); return { output: 'Matching Defaults entries for trainee on linux-target:\n    env_reset, mail_badpass\nUser trainee may run the following commands on linux-target:\n    (root) NOPASSWD: /usr/bin/find', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'uname -a') { next.enumerated = true; return { output: 'Linux linux-target 5.15.0-105-generic #115-Ubuntu SMP x86_64 GNU/Linux', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'cat /etc/os-release') return { output: 'PRETTY_NAME="Ubuntu 22.04.5 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"', state: next, prompt: promptFor(lab, next) };
    if (lower === 'cat /etc/passwd') { next.enumerated = true; return { output: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\ntrainee:x:1001:1001:CTF Trainee:/home/trainee:/bin/bash', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'cat /etc/hostname') return { output: 'linux-target', state: next, prompt: promptFor(lab, next) };
    if (lower === 'ls -l /usr/bin/find' || lower === 'stat /usr/bin/find') return { output: '-rwxr-xr-x 1 root root 224848 Jan 10 2024 /usr/bin/find\nEslatma: find faylining o‘zi SUID emas; zaiflik sudoers ruxsatida.', state: next, prompt: promptFor(lab, next) };
    if (lower === 'file /usr/bin/find') return { output: '/usr/bin/find: ELF 64-bit LSB pie executable, x86-64, dynamically linked', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('getcap')) { next.enumerated = true; return { output: '/usr/bin/ping cap_net_raw=ep\nBu labning asosiy yo‘li sudoers orqali noto‘g‘ri find ruxsati.', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'ps aux') { next.enumerated = true; return { output: 'USER PID %CPU %MEM COMMAND\nroot 1 0.0 0.1 /sbin/init\nroot 522 0.0 0.2 /usr/sbin/cron\ntrainee 901 0.0 0.1 -bash', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'ss -tulpn' || lower === 'netstat -tulpn') return { output: 'Netid State  Local Address:Port\ntcp   LISTEN 0.0.0.0:22  sshd\ntcp   LISTEN 127.0.0.1:3306 mysqld', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('grep ')) return { output: lower.includes('sudoers') ? 'trainee ALL=(root) NOPASSWD: /usr/bin/find' : 'grep: virtual dataset: matching line not found', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('find /usr/bin/find -perm -4000') || lower.startsWith('find /usr/bin/find -perm 4000')) return { output: 'find: /usr/bin/find faylida SUID biti o‘rnatilmagan. `sudo -l` orqali sudoers ruxsatini tekshiring.', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('find / -perm -4000') || lower.startsWith('find / -type f -perm -4000') || lower.startsWith('find / -perm -u=s')) return { output: '/usr/bin/passwd\n/usr/bin/sudo\n/usr/bin/mount\n/usr/bin/chsh\n/usr/bin/gpasswd\n\n/usr/bin/find SUID ro‘yxatida yo‘q. `sudo -l` natijasidagi NOPASSWD ruxsatiga e’tibor bering.', state: next, prompt: promptFor(lab, next) };
    if (linuxFindEscalation(lower)) {
      next.elevated = true; next.cwd = '/root'; next.exploitPrepared = true;
      markObjective(next, 1); markObjective(next, 2);
      return { output: 'find: privilege boundary crossed (SIMULATED)\n# Effective UID: 0 (root)\nVirtual shell root huquqiga o‘tdi. `whoami`, `id` va `cat /root/root.txt` bilan tekshiring.\nEslatma: buyruq haqiqiy hostda bajarilmadi.', state: next, prompt: promptFor(lab, next) };
    }
    if (lower.startsWith('sudo ') && /\bfind\b/.test(lower) && lower.includes('-exec') && lower.includes('/bin/sh')) return { output: 'Shell uchun `-p` flagini kiriting va `/usr/bin/find` sudoers ruxsati bilan ishlayotganini tekshiring. Masalan: sudo find . -exec /bin/sh -p \\;', state: next, prompt: promptFor(lab, next) };
    if (lower === 'cat /home/trainee/user.txt') return { output: `User flag: CTFUZ{linux_user_${crypto.createHmac('sha256', process.env.SESSION_SECRET || 'local-lab').update(String(sessionId)).digest('hex').slice(0, 12)}}`, state: next, prompt: promptFor(lab, next) };
    if (lower === 'cat /root/root.txt') return { output: next.elevated ? expectedFlag(sessionId, lab.slug) : 'cat: /root/root.txt: Permission denied', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('cat ')) return { output: 'cat: fayl topilmadi yoki ruxsat yo‘q.', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('find ')) return { output: 'find: virtual filesystem ichida natija yo‘q yoki qidiruv patterni qo‘llab-quvvatlanmaydi. `sudo -l` va `find / -perm -4000` natijalarini solishtiring.', state: next, prompt: promptFor(lab, next) };
  }

  if (lab.slug === 'windows-privesc') {
    const home = 'C:\\Users\\trainee';
    const cwd = next.cwd || home;
    const stripQuotes = value => String(value || '').trim().replace(/^"|"$/g, '');
    const winUsage = (name, syntax) => `${name} — noto‘g‘ri parametr yoki argument.\n${syntax}`;

    if (lower === 'help' || lower === 'man') return { output: windowsHelp(), state: next, prompt: promptFor(lab, next) };
    if (lower === 'pwd' || lower === 'cd') return { output: cwd, state: next, prompt: promptFor(lab, next) };
    if (lower === 'cls' || lower === 'clear') return { output: '[CLEAR]', state: next, prompt: promptFor(lab, next) };
    if (lower === 'history' || lower === 'historiy') return { output: 'Buyruqlar tarixi server tomonidan saqlanadi. `history` buyrug‘ini qayta yuboring yoki terminal tarixini yuqoridan ko‘ring.', state: next, prompt: promptFor(lab, next) };

    if (/^(?:cd|chdir)(?:\s|$)/i.test(command)) {
      let requested = command.replace(/^(?:cd|chdir)\s*/i, '').trim();
      requested = requested.replace(/^\/d\s+/i, '');
      if (!requested) return { output: cwd, state: next, prompt: promptFor(lab, next) };
      const normalized = normalizeWindowsVirtualPath(cwd, requested);
      if (normalized.error) return { output: normalized.error, state: next, prompt: promptFor(lab, next) };
      next.cwd = normalized.path;
      return { output: '', state: next, prompt: promptFor(lab, next) };
    }

    if (lower === 'dir' || lower === 'ls' || lower === 'get-childitem' || lower === 'gci' || lower.startsWith('dir ')) {
      let target = cwd;
      const arg = command.replace(/^dir\s*/i, '').trim();
      if (arg) {
        const normalized = normalizeWindowsVirtualPath(cwd, arg);
        if (normalized.error) return { output: normalized.error, state: next, prompt: promptFor(lab, next) };
        target = normalized.path;
      }
      return { output: windowsDirectoryListing(target), state: next, prompt: promptFor(lab, next) };
    }

    if (lower === 'whoami') return { output: next.elevated ? 'nt authority\\system' : 'win-target\\trainee', state: next, prompt: promptFor(lab, next) };
    if (lower === 'whoami /priv' || lower === 'whoami /all') {
      next.enumerated = true; markObjective(next, 1);
      return { output: 'PRIVILEGES INFORMATION\nSeChangeNotifyPrivilege       Enabled\nSeIncreaseWorkingSetPrivilege Disabled\nGROUP INFORMATION\nWIN-TARGET\\Users (Enabled)\nMandatory Label\\Medium Mandatory Level\n(virtual token listing)', state: next, prompt: promptFor(lab, next) };
    }
    if (lower === 'whoami /groups') return { output: next.elevated ? 'NT AUTHORITY\\SYSTEM\nMandatory Label\\System Mandatory Level' : 'WIN-TARGET\\Users\nMandatory Label\\Medium Mandatory Level', state: next, prompt: promptFor(lab, next) };
    if (lower === 'hostname') return { output: 'WIN-TARGET', state: next, prompt: promptFor(lab, next) };
    if (lower === 'systeminfo') { next.enumerated = true; markObjective(next, 1); return { output: 'Host Name: WIN-TARGET\nOS Name: Microsoft Windows Server (Lab)\nOS Version: 2022\nSystem Type: x64-based PC', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'ver') return { output: 'Microsoft Windows [Version 10.0.20348.2402] (Lab)', state: next, prompt: promptFor(lab, next) };
    if (lower === 'ipconfig' || lower === 'ipconfig /all') return { output: 'Windows IP Configuration\nEthernet adapter Ethernet0:\n   IPv4 Address. . . . . . . . . . . : 10.10.20.10\n   Subnet Mask . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . : 10.10.20.1', state: next, prompt: promptFor(lab, next) };
    if (lower === 'route print') return { output: 'IPv4 Route Table\nNetwork Destination  Netmask          Gateway       Interface\n0.0.0.0              0.0.0.0          10.10.20.1    10.10.20.10\n10.10.20.0           255.255.255.0    On-link       10.10.20.10', state: next, prompt: promptFor(lab, next) };
    if (lower === 'ip route' || lower === 'ip a' || lower === 'ip addr' || lower === 'ip config') return { output: `'${command}' Kali/Linux buyrug‘i. Siz Windows targetdasiz; Windows muqobili: 'ipconfig' yoki 'route print'.`, state: next, prompt: promptFor(lab, next) };
    if (lower === 'ps aux') return { output: "'ps' is not recognized as an internal or external command. Windows muqobili: tasklist.", state: next, prompt: promptFor(lab, next) };
    if (lower === 'tasklist') return { output: 'Image Name                     PID Session Name\nSystem Idle Process              0 Services\nSystem                           4 Services\nservices.exe                   640 Services\nsvchost.exe                    812 Services\nVulnSvcHost.exe               1420 Services\ncmd.exe                       2236 Console', state: next, prompt: promptFor(lab, next) };
    if (lower === 'netstat -ano') return { output: 'Proto  Local Address       Foreign Address     State       PID\nTCP    0.0.0.0:3389        0.0.0.0:0           LISTENING   640\nTCP    127.0.0.1:445       0.0.0.0:0           LISTENING   4', state: next, prompt: promptFor(lab, next) };
    if (lower === 'net user') { next.enumerated = true; markObjective(next, 1); return { output: 'User accounts for \\\\WIN-TARGET\nAdministrator  trainee  Guest  WDAGUtilityAccount', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'net localgroup administrators') { next.enumerated = true; markObjective(next, 1); return { output: 'Alias name  administrators\nMembers\nAdministrator\ntrainee (not a member)', state: next, prompt: promptFor(lab, next) }; }

    if (lower === 'sc query' || lower === 'sc query state= all') return { output: 'SERVICE_NAME: VulnSvc  STATE: 4 RUNNING\nSERVICE_NAME: Spooler   STATE: 4 RUNNING\nSERVICE_NAME: W32Time   STATE: 4 RUNNING', state: next, prompt: promptFor(lab, next) };
    if (lower === 'sc qc') return { output: 'DESCRIPTION:\nUsage: sc qc <service_name>\nMavjud lab servisi: VulnSvc\nMasalan: sc qc VulnSvc', state: next, prompt: promptFor(lab, next) };
    if (lower === 'sc qc vulnsvc') {
      next.enumerated = true; next.serviceInspected = true; markObjective(next, 1);
      if (next.aclInspected) markObjective(next, 2);
      return { output: '[SC] QueryServiceConfig SUCCESS\nSERVICE_NAME: VulnSvc\nBINARY_PATH_NAME: C:\\Program Files\\VulnSvc\\service.exe\nSTART_TYPE: 2 AUTO_START\nSERVICE_START_NAME: LocalSystem\nNOTE: service binary path Users group tomonidan o‘zgartirilishi mumkin.', state: next, prompt: promptFor(lab, next) };
    }
    if (lower.startsWith('sc qc ')) return { output: '[SC] OpenService FAILED 1060:\nThe specified service does not exist as an installed service. Labdagi servis nomi: VulnSvc.', state: next, prompt: promptFor(lab, next) };
    if (lower === 'sc query vulnsvc') return { output: 'SERVICE_NAME: VulnSvc\n        TYPE               : 10  WIN32_OWN_PROCESS\n        STATE              : 4  RUNNING', state: next, prompt: promptFor(lab, next) };
    if (lower === 'sc config') return { output: winUsage('sc config', 'Syntax: sc config <service_name> [binPath= <binary_path>]\nLab service: VulnSvc'), state: next, prompt: promptFor(lab, next) };
    if (lower === 'sc config vulnsvc') return { output: winUsage('sc config VulnSvc', 'Syntax: sc config VulnSvc binPath= "<command>"'), state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('sc config ')) {
      if (!/^sc\s+config\s+vulnsvc\s+binpath\s*=/i.test(command)) return { output: '[SC] ChangeServiceConfig FAILED 87:\nNoto‘g‘ri parametr. Syntax: sc config VulnSvc binPath= "<command>"', state: next, prompt: promptFor(lab, next) };
      if (!next.serviceInspected || !next.aclInspected) return { output: 'Access is denied. Avval `sc qc VulnSvc` va `icacls "C:\\Program Files\\VulnSvc\\service.exe"` orqali zaif konfiguratsiyani aniqlang.', state: next, prompt: promptFor(lab, next) };
      next.serviceConfigured = true; next.exploitPrepared = true; markObjective(next, 2);
      return { output: '[SC] ChangeServiceConfig SUCCESS\nLab binary path konfiguratsiyasi o‘zgartirildi (SIMULATED). Endi `sc start VulnSvc` buyrug‘ini bajaring.', state: next, prompt: promptFor(lab, next) };
    }
    if (lower === 'sc start' || lower === 'sc start vulnsvc') {
      if (!next.serviceConfigured) return { output: '[SC] StartService FAILED 5: Access is denied. Avval servis binary path ruxsati zaifligini aniqlab, lab konfiguratsiyasini yangilang.', state: next, prompt: promptFor(lab, next) };
      next.elevated = true; markObjective(next, 3);
      return { output: '[SC] StartService SUCCESS\nVulnSvc SYSTEM token bilan ishga tushdi (SIMULATED). `whoami` va `type C:\\ProgramData\\root.txt` bilan tekshiring.', state: next, prompt: promptFor(lab, next) };
    }
    if (lower.startsWith('sc start ')) return { output: '[SC] StartService FAILED 1060: Service nomi topilmadi. Lab servisi: VulnSvc.', state: next, prompt: promptFor(lab, next) };
    if (lower === 'get-service' || lower.startsWith('get-service ')) return { output: 'Status  Name      DisplayName\nRunning VulnSvc  Vulnerable Training Service\nRunning Spooler  Print Spooler\nStopped W32Time  Windows Time', state: next, prompt: promptFor(lab, next) };

    if (lower === 'icacls') return { output: 'Syntax: icacls <file_or_directory>\nMisol: icacls "C:\\Program Files\\VulnSvc\\service.exe"', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('icacls ') || lower.startsWith('get-acl ')) {
      const target = stripQuotes(command.replace(/^(?:icacls|get-acl)\s+/i, '')).toLowerCase();
      next.enumerated = true; next.aclInspected = true; markObjective(next, 1);
      if (next.serviceInspected) markObjective(next, 2);
      if (target.includes('vulnsvc') || target.includes('service.exe') || target === '.') return { output: 'C:\\Program Files\\VulnSvc\\service.exe WIN-TARGET\\Users:(M)\n                           BUILTIN\\Administrators:(F)\n                           NT AUTHORITY\\SYSTEM:(F)\nSuccessfully processed 1 files; Failed processing 0 files.\nUsers guruhida Modify (M) ruxsati mavjud — bu labdagi zaiflik.', state: next, prompt: promptFor(lab, next) };
      return { output: `C:\\Users\\trainee\\${stripQuotes(command.replace(/^icacls\s+/i, ''))} WIN-TARGET\\trainee:(F)\nBUILTIN\\Administrators:(F)`, state: next, prompt: promptFor(lab, next) };
    }

    if (lower.startsWith('type ') || lower.startsWith('cat ')) {
      const requested = stripQuotes(command.replace(/^(?:type|cat)\s+/i, ''));
      const resolved = /^[a-z]:\\/i.test(requested) ? path.win32.normalize(requested) : path.win32.resolve(cwd, requested);
      const file = resolved.toLowerCase();
      if (file === 'c:\\programdata\\root.txt' || file === 'c:\\programdata\\vulnsvc\\root.txt') return { output: next.elevated ? expectedFlag(sessionId, lab.slug) : 'Access is denied.', state: next, prompt: promptFor(lab, next) };
      if (file === 'c:\\program files\\vulnsvc\\config.ini') return { output: '[Service]\nName=VulnSvc\nBinaryPath=C:\\Program Files\\VulnSvc\\service.exe\nStartName=LocalSystem\nNote=Training configuration file', state: next, prompt: promptFor(lab, next) };
      if (file === 'c:\\users\\trainee\\desktop\\readme.txt' || file === 'c:\\users\\trainee\\documents\\welcome.txt') return { output: 'CTF.UZ Windows PrivEsc lab. Inspect services and file permissions; all actions are simulated.', state: next, prompt: promptFor(lab, next) };
      if (file.endsWith('ntuser.dat')) return { output: 'The file is a binary Windows Registry hive. Use `reg query` to inspect registry values.', state: next, prompt: promptFor(lab, next) };
      if (file.endsWith('root.txt') || file.endsWith('flag.txt')) return { output: 'Access is denied.', state: next, prompt: promptFor(lab, next) };
      return { output: 'The system cannot find the file specified.', state: next, prompt: promptFor(lab, next) };
    }

    if (lower.startsWith('reg query')) return { output: 'ERROR: The system was unable to find the specified registry key or value. (Windows PrivEsc labda UAC registry kerak emas.)', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('reg add')) return { output: 'The operation completed successfully. (Registry change simulated; bu Windows PrivEsc xonasining asosiy yo‘li emas.)', state: next, prompt: promptFor(lab, next) };
    if (lower === 'sudo -l' || lower.startsWith('sudo ')) return { output: "'sudo' is not recognized as an internal or external command. Siz Windows targetdasiz; Linux sudo tekshiruvi uchun Kali shelliga `exit` bilan qayting yoki Windows ruxsatlari uchun `whoami /all` dan foydalaning.", state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('cat ')) return { output: "Windows CMD'da `type` buyrug‘idan foydalaning.", state: next, prompt: promptFor(lab, next) };
    if (lower === 'find' || lower.startsWith('find ')) return { output: "Windows CMD'da `find` matn qidiradi. Fayl qidirish uchun `where /r C:\\ <name>` yoki `dir /s <name>` dan foydalaning.", state: next, prompt: promptFor(lab, next) };
    if (lower === 'historiy') return { output: "Buyruq nomi `history` (imlo: history).", state: next, prompt: promptFor(lab, next) };
  }

  if (lab.slug === 'uac-bypass') {
    if (lower === 'whoami') return { output: 'win-target\\trainee', state: next, prompt: promptFor(lab, next) };
    if (lower === 'whoami /groups' || lower === 'whoami /all') { next.enumerated = true; markObjective(next, 1); return { output: next.elevated ? 'WIN-TARGET\\Administrators\nMandatory Label\\High Mandatory Level' : 'WIN-TARGET\\Users\nMandatory Label\\Medium Mandatory Level', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'whoami /priv') return { output: 'SeChangeNotifyPrivilege Enabled\nSeIncreaseWorkingSetPrivilege Disabled', state: next, prompt: promptFor(lab, next) };
    if (lower.includes('reg query') && lower.includes('ms-settings')) { next.enumerated = true; markObjective(next, 1); return { output: next.uacDefaultConfigured ? 'HKEY_CURRENT_USER\\Software\\Classes\\ms-settings\\Shell\\Open\\command\n    (Default)    REG_SZ    cmd.exe\n    DelegateExecute    REG_SZ' : 'ERROR: The system was unable to find the specified registry key or value.', state: next, prompt: promptFor(lab, next) }; }
    if (lower.startsWith('reg add') && lower.includes('ms-settings') && lower.includes('/ve') && lower.includes('cmd.exe')) { next.uacDefaultConfigured = true; next.exploitPrepared = Boolean(next.uacDelegateConfigured); if (next.exploitPrepared) markObjective(next, 2); return { output: 'The operation completed successfully. (default handler configured in simulation)', state: next, prompt: promptFor(lab, next) }; }
    if (lower.startsWith('reg add') && lower.includes('ms-settings') && lower.includes('delegateexecute')) { next.uacDelegateConfigured = true; next.exploitPrepared = Boolean(next.uacDefaultConfigured); if (next.exploitPrepared) markObjective(next, 2); return { output: 'The operation completed successfully. (DelegateExecute configured in simulation)', state: next, prompt: promptFor(lab, next) }; }
    if (lower === 'start fodhelper.exe' || lower === 'start-process fodhelper.exe') {
      if (!next.uacDefaultConfigured || !next.uacDelegateConfigured) return { output: 'Fodhelper ishga tushdi, lekin auto-elevation handler topilmadi. Registry handler va DelegateExecute holatini tekshiring.', state: next, prompt: promptFor(lab, next) };
      next.elevated = true; markObjective(next, 3);
      return { output: 'fodhelper.exe auto-elevation flow (SIMULATED)\nIntegrity level: High\nBu SYSTEM emas — faqat yuqori integrity token.', state: next, prompt: promptFor(lab, next) };
    }
    if (lower === 'type c:\\users\\administrator\\desktop\\flag.txt') return { output: next.elevated ? expectedFlag(sessionId, lab.slug) : 'Access is denied.', state: next, prompt: promptFor(lab, next) };
    if (lower.startsWith('type ')) return { output: 'The system cannot find the file specified.', state: next, prompt: promptFor(lab, next) };
  }

  return { output: `'${command.slice(0, 90)}' buyrug‘i ushbu lab simulyatorida qo‘llab-quvvatlanmaydi. Mavjud buyruqlar uchun 'help' yozing.`, state: next, prompt: promptFor(lab, next) };
}

module.exports = { LABS, expectedFlag, promptFor, executeLabCommand };
