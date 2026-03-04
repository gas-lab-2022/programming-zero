import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callClaude } from '../../src/utils/claude.js';
import * as child_process from 'child_process';

vi.mock('child_process');

describe('callClaude', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('spawns claude CLI with -p flag and pipes prompt via stdin', async () => {
    const mockStdout = { on: vi.fn() };
    const mockStderr = { on: vi.fn() };
    const mockStdin = { write: vi.fn(), end: vi.fn() };
    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin,
      on: vi.fn(),
    };

    vi.mocked(child_process.spawn).mockReturnValue(mockProc as any);

    // Simulate successful response
    mockStdout.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'data') cb(Buffer.from('Claude response text'));
    });
    mockStderr.on.mockImplementation(() => {});
    mockProc.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'close') cb(0);
    });

    const result = await callClaude('test prompt');

    expect(child_process.spawn).toHaveBeenCalledWith('claude', ['-p'], expect.any(Object));
    expect(mockStdin.write).toHaveBeenCalledWith('test prompt');
    expect(mockStdin.end).toHaveBeenCalled();
    expect(result).toBe('Claude response text');
  });

  it('passes --allowedTools when specified', async () => {
    const mockStdout = { on: vi.fn() };
    const mockStderr = { on: vi.fn() };
    const mockStdin = { write: vi.fn(), end: vi.fn() };
    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin,
      on: vi.fn(),
    };

    vi.mocked(child_process.spawn).mockReturnValue(mockProc as any);

    mockStdout.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'data') cb(Buffer.from('response'));
    });
    mockStderr.on.mockImplementation(() => {});
    mockProc.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'close') cb(0);
    });

    await callClaude('prompt', { allowedTools: ['WebSearch', 'WebFetch'] });

    expect(child_process.spawn).toHaveBeenCalledWith(
      'claude',
      ['-p', '--allowedTools', 'WebSearch', '--allowedTools', 'WebFetch'],
      expect.any(Object),
    );
  });

  it('rejects when claude CLI exits with non-zero code', async () => {
    const mockStdout = { on: vi.fn() };
    const mockStderr = { on: vi.fn() };
    const mockStdin = { write: vi.fn(), end: vi.fn() };
    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin,
      on: vi.fn(),
    };

    vi.mocked(child_process.spawn).mockReturnValue(mockProc as any);

    mockStdout.on.mockImplementation(() => {});
    mockStderr.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'data') cb(Buffer.from('error message'));
    });
    mockProc.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'close') cb(1);
    });

    await expect(callClaude('bad prompt')).rejects.toThrow('Claude CLI exited with code 1');
  });

  it('rejects when claude CLI fails to spawn', async () => {
    const mockStdout = { on: vi.fn() };
    const mockStderr = { on: vi.fn() };
    const mockStdin = { write: vi.fn(), end: vi.fn() };
    const mockProc = {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin,
      on: vi.fn(),
    };

    vi.mocked(child_process.spawn).mockReturnValue(mockProc as any);

    mockStdout.on.mockImplementation(() => {});
    mockStderr.on.mockImplementation(() => {});
    mockProc.on.mockImplementation((event: string, cb: Function) => {
      if (event === 'error') cb(new Error('ENOENT'));
    });

    await expect(callClaude('prompt')).rejects.toThrow('ENOENT');
  });
});
