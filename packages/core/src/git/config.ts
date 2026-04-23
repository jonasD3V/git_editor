import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitUserConfig {
  name: string;
  email: string;
}

async function runGit(args: string[], cwd?: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd });
    return stdout.trim();
  } catch {
    return '';
  }
}

async function setGit(args: string[], cwd?: string): Promise<void> {
  await execFileAsync('git', args, { cwd });
}

export async function getGlobalConfig(): Promise<GitUserConfig> {
  const [name, email] = await Promise.all([
    runGit(['config', '--global', 'user.name']),
    runGit(['config', '--global', 'user.email']),
  ]);
  return { name, email };
}

export async function setGlobalConfig(
  config: Partial<GitUserConfig>
): Promise<void> {
  const ops: Promise<void>[] = [];
  if (config.name !== undefined)
    ops.push(setGit(['config', '--global', 'user.name', config.name]));
  if (config.email !== undefined)
    ops.push(setGit(['config', '--global', 'user.email', config.email]));
  await Promise.all(ops);
}

export async function getLocalConfig(repoPath: string): Promise<GitUserConfig> {
  const [name, email] = await Promise.all([
    runGit(['config', '--local', 'user.name'], repoPath),
    runGit(['config', '--local', 'user.email'], repoPath),
  ]);
  return { name, email };
}

export async function setLocalConfig(
  repoPath: string,
  config: Partial<GitUserConfig>
): Promise<void> {
  const ops: Promise<void>[] = [];
  if (config.name !== undefined)
    ops.push(setGit(['config', '--local', 'user.name', config.name], repoPath));
  if (config.email !== undefined)
    ops.push(
      setGit(['config', '--local', 'user.email', config.email], repoPath)
    );
  await Promise.all(ops);
}

export async function unsetLocalConfig(
  repoPath: string,
  key: 'name' | 'email'
): Promise<void> {
  const gitKey = key === 'name' ? 'user.name' : 'user.email';
  try {
    await execFileAsync('git', ['config', '--local', '--unset', gitKey], {
      cwd: repoPath,
    });
  } catch {
    // already unset — ignore
  }
}
