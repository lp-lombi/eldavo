const { spawn } = require('node:child_process');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const backendUrl = 'http://localhost:3005';
const frontendUrl = 'http://localhost:8081';
const processes = [];
const cloudflaredCandidates = process.platform === 'win32'
  ? ['C:\\Program Files\\cloudflared\\cloudflared.exe', 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe']
  : ['cloudflared'];

function getCloudflaredCommand() {
  const installedPath = cloudflaredCandidates.find((candidate) => candidate === 'cloudflared' || fs.existsSync(candidate));
  if (installedPath) return installedPath;
  try {
    execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', ['cloudflared'], { stdio: 'ignore' });
    return 'cloudflared';
  } catch {
    return null;
  }
}

function log(message) {
  console.log(`[share:dev] ${message}`);
}

function startProcess(command, args, environment = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...environment },
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  child.stdout.on('data', (data) => process.stdout.write(`[${command}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${command}] ${data}`));
  processes.push(child);
  return child;
}

function stopProcesses() {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
}

function waitForHttp(url, timeoutMs = 30000, acceptAnyResponse = false) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const response = await fetch(url);
        if (response.ok || acceptAnyResponse) {
          resolve();
          return;
        }
      } catch {
        // The local service may need a few seconds to start.
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Timeout esperando ${url}`));
        return;
      }
      setTimeout(check, 500);
    };
    void check();
  });
}

function startTunnel(url, timeoutMs = 30000) {
  const cloudflaredCommand = getCloudflaredCommand();
  if (!cloudflaredCommand) return Promise.reject(new Error('No se encontró cloudflared. Instalalo con `winget install Cloudflare.cloudflared` y abrí una nueva terminal.'));
  return new Promise((resolve, reject) => {
    const tunnel = spawn(cloudflaredCommand, ['tunnel', '--url', url], {
      cwd: root,
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32' && cloudflaredCommand === 'cloudflared',
    });
    processes.push(tunnel);
    let output = '';
    const handleOutput = (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(`[cloudflared] ${text}`);
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (match) resolve({ process: tunnel, url: match[0] });
    };
    tunnel.stdout.on('data', handleOutput);
    tunnel.stderr.on('data', handleOutput);
    tunnel.once('error', (error) => reject(new Error('No se encontró cloudflared. Instalalo desde https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/.')));
    setTimeout(() => reject(new Error(`No se obtuvo una URL pública para ${url}`)), timeoutMs);
  });
}

async function main() {
  if (process.platform === 'win32') {
    log('Para detener todo, presioná Ctrl+C en esta ventana.');
  }
  startProcess(npmCommand, ['run', 'dev:backend']);
  await waitForHttp(`${backendUrl}/health`);
  const backendTunnel = await startTunnel(backendUrl);
  log(`Backend público: ${backendTunnel.url}`);

  startProcess(npmCommand, ['run', 'web', '--workspace', '@eldavo/frontend', '--', '--port', '8081'], {
    EXPO_PUBLIC_API_URL: backendTunnel.url,
  });
  await waitForHttp(frontendUrl, 30000, true);
  const frontendTunnel = await startTunnel(frontendUrl);

  console.log('');
  log(`Web pública: ${frontendTunnel.url}`);
  log(`API pública: ${backendTunnel.url}`);
  log('Compartí la URL de Web pública.');
}

process.on('SIGINT', () => {
  stopProcesses();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stopProcesses();
  process.exit(0);
});
process.on('exit', stopProcesses);

main().catch((error) => {
  console.error(`[share:dev] ${error.message}`);
  stopProcesses();
  process.exitCode = 1;
});
