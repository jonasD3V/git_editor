import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface SSHKeyInfo {
  name: string;
  publicKeyPath: string;
  privateKeyPath: string;
  type: string;
  fingerprint: string;
  publicKey: string;
  hasPrivateKey: boolean;
}

export class SSHManager {
  private readonly sshDir: string;

  constructor() {
    this.sshDir = path.join(os.homedir(), '.ssh');
  }

  getSshDir(): string {
    return this.sshDir;
  }

  async listKeys(): Promise<SSHKeyInfo[]> {
    try {
      await fs.mkdir(this.sshDir, { recursive: true });
      const files = await fs.readdir(this.sshDir);
      const pubFiles = files.filter((f) => f.endsWith('.pub'));

      const keys: SSHKeyInfo[] = [];
      for (const pubFile of pubFiles) {
        const pubPath = path.join(this.sshDir, pubFile);
        const privPath = pubPath.slice(0, -4);
        const name = pubFile.slice(0, -4);

        try {
          const pubContent = await fs.readFile(pubPath, 'utf-8');
          const firstPart = pubContent.trim().split(' ')[0] ?? '';
          const type = firstPart.replace('ssh-', '').replace('ecdsa-sha2-', '');

          let fingerprint = '';
          try {
            const { stdout } = await execFileAsync('ssh-keygen', [
              '-lf',
              pubPath,
            ]);
            fingerprint = stdout.trim().split(' ')[1] ?? '';
          } catch {
            fingerprint = 'unavailable';
          }

          let hasPrivateKey = false;
          try {
            await fs.access(privPath);
            hasPrivateKey = true;
          } catch {
            // no private key
          }

          keys.push({
            name,
            publicKeyPath: pubPath,
            privateKeyPath: privPath,
            type,
            fingerprint,
            publicKey: pubContent.trim(),
            hasPrivateKey,
          });
        } catch {
          // skip unreadable keys
        }
      }
      return keys;
    } catch {
      return [];
    }
  }

  async generateKey(
    name: string,
    type: 'ed25519' | 'rsa' = 'ed25519',
    comment = ''
  ): Promise<SSHKeyInfo> {
    await fs.mkdir(this.sshDir, { recursive: true });
    const keyPath = path.join(this.sshDir, name);

    try {
      await fs.access(keyPath);
      throw new Error(`Key "${name}" already exists`);
    } catch (e) {
      if (e instanceof Error && e.message.includes('already exists')) throw e;
    }

    const args = ['-t', type, '-f', keyPath, '-N', '', '-C', comment || name];
    if (type === 'rsa') args.push('-b', '4096');

    await execFileAsync('ssh-keygen', args);

    const keys = await this.listKeys();
    const newKey = keys.find((k) => k.name === name);
    if (!newKey) throw new Error('Key generation succeeded but key not found');
    return newKey;
  }

  async deleteKey(name: string): Promise<void> {
    const pubPath = path.join(this.sshDir, `${name}.pub`);
    const privPath = path.join(this.sshDir, name);
    try {
      await fs.unlink(pubPath);
    } catch {
      /* ignore */
    }
    try {
      await fs.unlink(privPath);
    } catch {
      /* ignore */
    }
  }
}
