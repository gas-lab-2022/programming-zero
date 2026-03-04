import { spawn } from 'child_process';
import type { ClaudeOptions } from '../types.js';

export function callClaude(prompt: string, options?: ClaudeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p'];

    if (options?.allowedTools) {
      for (const tool of options.allowedTools) {
        args.push('--allowedTools', tool);
      }
    }

    if (options?.maxTurns) {
      args.push('--max-turns', String(options.maxTurns));
    }

    const proc = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('error', (err: Error) => {
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}`));
    });

    proc.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }
      resolve(stdout);
    });

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}
