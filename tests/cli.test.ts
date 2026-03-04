import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock pipeline before importing
vi.mock('../src/pipeline.js', () => ({
  runPipeline: vi.fn(),
}));

// Mock dotenv
vi.mock('dotenv/config', () => ({}));

describe('CLI', () => {
  const originalArgv = process.argv;
  const originalEnv = { ...process.env };
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      WP_SITE_URL: 'https://example.com',
      WP_USERNAME: 'user',
      WP_APP_PASSWORD: 'pass',
    };
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    vi.resetModules();
  });

  it('calls runPipeline with keyword and config from env', async () => {
    process.argv = ['node', 'cli.ts', 'TypeScript 入門'];

    const { runPipeline } = await import('../src/pipeline.js');
    vi.mocked(runPipeline).mockResolvedValue({ id: 1, link: 'https://example.com/post', status: 'draft' });

    const { main } = await import('../src/cli.js');
    await main();

    expect(runPipeline).toHaveBeenCalledWith('TypeScript 入門', {
      siteUrl: 'https://example.com',
      username: 'user',
      appPassword: 'pass',
    });
  });

  it('exits with error when keyword is not provided', async () => {
    process.argv = ['node', 'cli.ts'];

    const { main } = await import('../src/cli.js');
    await main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('キーワード'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when env vars are missing', async () => {
    process.argv = ['node', 'cli.ts', 'keyword'];
    delete process.env.WP_SITE_URL;

    const { main } = await import('../src/cli.js');
    await main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('WP_SITE_URL'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
