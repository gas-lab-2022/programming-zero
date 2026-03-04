# WordPress Article Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI tool (`npm run generate -- "keyword"`) that generates SEO-optimized Japanese articles for `programming-zero.net` (WordPress) using Claude Code as the AI runtime.

**Architecture:** A 7-step sequential pipeline (Step 0-6) orchestrated by TypeScript. Each step constructs a specialized prompt and invokes the `claude` CLI in print mode (`claude -p`). The WordPress REST API handles article fetching (style learning) and publishing (draft). No external AI/search API keys required — uses Claude Code subscription and built-in WebSearch.

**Tech Stack:** TypeScript, Node.js (native `fetch`), `claude` CLI (`-p` print mode), WordPress REST API, Vitest

---

## Architecture Overview

```
npm run generate -- "keyword"
    │
    ├── Step 0: Fetch recent posts via WP REST API
    │           → claude -p analyzes writing style → StyleProfile
    │
    ├── Step 1: claude -p analyzes keyword intent → KeywordAnalysis
    │
    ├── Step 2: claude -p --allowedTools WebSearch,WebFetch
    │           → searches & analyzes top SEO articles → SeoAnalysis
    │
    ├── Step 3: claude -p deep dives reader intent → IntentDeepDive
    │
    ├── Step 4: claude -p designs differentiation → Differentiation
    │
    ├── Step 5: claude -p creates outline (uses StyleProfile) → ArticleOutline
    │
    ├── Step 6: claude -p generates article (uses StyleProfile) → ArticleContent
    │
    └── Publish: POST to WP REST API as draft
```

**Key design decisions:**
- Each pipeline step = independent `claude -p` call with focused prompt
- Context from previous steps passed explicitly in prompts (snowball accumulation)
- Step 2 is the only step that uses `--allowedTools` (WebSearch, WebFetch)
- StyleProfile injected into Steps 5 and 6 for consistent voice
- All Claude responses expected as JSON in fenced code blocks

**Directory structure:**

```
src/
├── cli.ts                    # CLI entry point
├── pipeline.ts               # Pipeline orchestrator
├── types.ts                  # All type definitions
├── utils/
│   ├── claude.ts             # Claude CLI wrapper
│   ├── wordpress.ts          # WordPress REST API client
│   ├── html.ts               # HTML tag stripping
│   └── json.ts               # JSON extraction from Claude responses
└── steps/
    ├── styleAnalysis.ts      # Step 0: Style profile analysis
    ├── keywordAnalysis.ts    # Step 1: Keyword structure understanding
    ├── seoAnalysis.ts        # Step 2: SEO top article analysis
    ├── intentDeepDive.ts     # Step 3: Reader intent deep dive
    ├── differentiation.ts    # Step 4: Differentiation design
    ├── outline.ts            # Step 5: Article outline creation
    └── articleGeneration.ts  # Step 6: Article generation

tests/
├── utils/
│   ├── claude.test.ts
│   ├── wordpress.test.ts
│   ├── html.test.ts
│   └── json.test.ts
├── steps/
│   ├── styleAnalysis.test.ts
│   ├── keywordAnalysis.test.ts
│   ├── seoAnalysis.test.ts
│   ├── intentDeepDive.test.ts
│   ├── differentiation.test.ts
│   ├── outline.test.ts
│   └── articleGeneration.test.ts
├── pipeline.test.ts
└── cli.test.ts
```

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Create package.json**

```json
{
  "name": "programming-zero-generator",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "generate": "tsx src/cli.ts",
    "build": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0",
    "@types/node": "^22.0.0"
  },
  "dependencies": {
    "dotenv": "^16.4.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Step 4: Create .env.example**

```env
# WordPress接続情報
WP_SITE_URL=https://programming-zero.net
WP_USERNAME=your_wordpress_username
WP_APP_PASSWORD=your_application_password
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
.env
```

**Step 6: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated

**Step 7: Verify setup**

Run: `npx tsc --noEmit`
Expected: No errors (no source files yet, clean exit)

**Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .env.example .gitignore
git commit -m "chore: project setup with TypeScript, Vitest, and dotenv"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/types.ts`
- Create: `tests/types.test.ts`

**Step 1: Write the type validation test**

```typescript
// tests/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type {
  WpConfig,
  WpPost,
  WpPostResult,
  StyleProfile,
  KeywordAnalysis,
  SeoAnalysis,
  IntentDeepDive,
  Differentiation,
  ArticleOutline,
  ArticleContent,
  PipelineContext,
} from '../src/types.js';

describe('types', () => {
  it('WpConfig has required fields', () => {
    expectTypeOf<WpConfig>().toHaveProperty('siteUrl');
    expectTypeOf<WpConfig>().toHaveProperty('username');
    expectTypeOf<WpConfig>().toHaveProperty('appPassword');
  });

  it('StyleProfile has required fields', () => {
    expectTypeOf<StyleProfile>().toHaveProperty('writingStyle');
    expectTypeOf<StyleProfile>().toHaveProperty('sentenceEndings');
    expectTypeOf<StyleProfile>().toHaveProperty('tone');
    expectTypeOf<StyleProfile>().toHaveProperty('headingPattern');
    expectTypeOf<StyleProfile>().toHaveProperty('sectionStructure');
  });

  it('PipelineContext accumulates all step outputs', () => {
    expectTypeOf<PipelineContext>().toHaveProperty('keyword');
    expectTypeOf<PipelineContext>().toHaveProperty('styleProfile');
    expectTypeOf<PipelineContext>().toHaveProperty('keywordAnalysis');
    expectTypeOf<PipelineContext>().toHaveProperty('seoAnalysis');
    expectTypeOf<PipelineContext>().toHaveProperty('intentDeepDive');
    expectTypeOf<PipelineContext>().toHaveProperty('differentiation');
    expectTypeOf<PipelineContext>().toHaveProperty('outline');
  });

  it('ArticleContent has fields needed for WordPress publishing', () => {
    expectTypeOf<ArticleContent>().toHaveProperty('title');
    expectTypeOf<ArticleContent>().toHaveProperty('htmlContent');
    expectTypeOf<ArticleContent>().toHaveProperty('metaDescription');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/types.test.ts`
Expected: FAIL — cannot find module `../src/types.js`

**Step 3: Implement types**

```typescript
// src/types.ts

// WordPress configuration
export interface WpConfig {
  siteUrl: string;
  username: string;
  appPassword: string;
}

// WordPress post from REST API
export interface WpPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  date: string;
}

// WordPress post creation result
export interface WpPostResult {
  id: number;
  link: string;
  status: string;
}

// Step 0 output: Writing style profile
export interface StyleProfile {
  writingStyle: string;       // 文体の全体的な特徴
  sentenceEndings: string[];  // 語尾パターン（例: 〜です、〜ます、〜だ）
  tone: string;               // 敬体/常体、トーンの特徴
  headingPattern: string;     // H2/H3の使い方パターン
  sectionStructure: string;   // セクション構成の傾向
}

// Step 1 output: Keyword intent analysis
export interface KeywordAnalysis {
  keyword: string;
  surfaceIntent: string;      // 表層意図
  latentIntent: string;       // 潜在意図
  finalGoal: string;          // 最終ゴール
  searchQueries: string[];    // 派生検索クエリ（3〜5個）
}

// Step 2 output: SEO top article analysis
export interface SeoAnalysis {
  topArticles: Array<{
    url: string;
    title: string;
    summary: string;
  }>;
  commonStructure: string[];    // 上位記事の共通構造
  mustCoverTopics: string[];    // 必須カバー項目
  gapOpportunities: string[];   // 上位記事の不足点・差別化機会
}

// Step 3 output: Reader intent deep dive
export interface IntentDeepDive {
  readerSituation: string;      // 読者の典型的な状況
  readerAnxieties: string[];    // 読者の不安
  decisionBarriers: string[];   // 決断障壁
  desiredOutcomes: string[];    // 読後に望む結果
}

// Step 4 output: Differentiation strategy
export interface Differentiation {
  differentiationPoints: Array<{
    category: string;           // 差別化カテゴリ（構造化/データ/因果/失敗パターン）
    description: string;
  }>;
  uniqueValueProposition: string; // この記事ならではの価値
}

// Step 5 output: Article outline
export interface ArticleOutline {
  title: string;
  metaDescription: string;
  sections: Array<{
    heading: string;            // H2見出し
    subheadings: string[];      // H3見出し
    keyPoints: string[];        // そのセクションで伝える要点
  }>;
}

// Step 6 output: Generated article content
export interface ArticleContent {
  title: string;
  htmlContent: string;
  metaDescription: string;
  tags: string[];
}

// Pipeline accumulated context
export interface PipelineContext {
  keyword: string;
  styleProfile: StyleProfile;
  keywordAnalysis: KeywordAnalysis;
  seoAnalysis: SeoAnalysis;
  intentDeepDive: IntentDeepDive;
  differentiation: Differentiation;
  outline: ArticleOutline;
}

// Claude CLI wrapper options
export interface ClaudeOptions {
  allowedTools?: string[];
  maxTurns?: number;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types.ts tests/types.test.ts
git commit -m "feat: add all type definitions for pipeline steps"
```

---

### Task 3: HTML Utility

**Files:**
- Create: `src/utils/html.ts`
- Create: `tests/utils/html.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/utils/html.test.ts
import { describe, it, expect } from 'vitest';
import { stripHtml } from '../../src/utils/html.js';

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('decodes common HTML entities', () => {
    expect(stripHtml('A &amp; B &lt; C &gt; D &quot;E&quot;')).toBe('A & B < C > D "E"');
  });

  it('replaces &nbsp; with space', () => {
    expect(stripHtml('Hello&nbsp;world')).toBe('Hello world');
  });

  it('collapses multiple whitespace', () => {
    expect(stripHtml('<p>Hello</p>  <p>world</p>')).toBe('Hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(stripHtml('  <p>Hello</p>  ')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('preserves newlines between block elements as single space', () => {
    expect(stripHtml('<h2>Title</h2>\n<p>Content</p>')).toBe('Title Content');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/html.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement stripHtml**

```typescript
// src/utils/html.ts
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/html.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/html.ts tests/utils/html.test.ts
git commit -m "feat: add HTML tag stripping utility"
```

---

### Task 4: JSON Extraction Utility

**Files:**
- Create: `src/utils/json.ts`
- Create: `tests/utils/json.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/utils/json.test.ts
import { describe, it, expect } from 'vitest';
import { extractJson } from '../../src/utils/json.js';

describe('extractJson', () => {
  it('extracts JSON from fenced code block', () => {
    const text = 'Here is the result:\n```json\n{"key": "value"}\n```\nDone.';
    expect(extractJson<{ key: string }>(text)).toEqual({ key: 'value' });
  });

  it('extracts JSON from code block without language tag', () => {
    const text = '```\n{"key": "value"}\n```';
    expect(extractJson<{ key: string }>(text)).toEqual({ key: 'value' });
  });

  it('parses raw JSON string', () => {
    const text = '{"key": "value"}';
    expect(extractJson<{ key: string }>(text)).toEqual({ key: 'value' });
  });

  it('handles multiline JSON in code block', () => {
    const text = '```json\n{\n  "a": 1,\n  "b": [2, 3]\n}\n```';
    expect(extractJson<{ a: number; b: number[] }>(text)).toEqual({ a: 1, b: [2, 3] });
  });

  it('throws on invalid JSON', () => {
    expect(() => extractJson('not json at all')).toThrow();
  });

  it('extracts first JSON block when multiple exist', () => {
    const text = '```json\n{"first": true}\n```\n```json\n{"second": true}\n```';
    expect(extractJson<{ first: boolean }>(text)).toEqual({ first: true });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/json.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement extractJson**

```typescript
// src/utils/json.ts
export function extractJson<T>(text: string): T {
  // Try fenced code block (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }

  // Try raw JSON parse
  const trimmed = text.trim();
  return JSON.parse(trimmed);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/json.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/json.ts tests/utils/json.test.ts
git commit -m "feat: add JSON extraction utility for Claude responses"
```

---

### Task 5: Claude CLI Wrapper

**Files:**
- Create: `src/utils/claude.ts`
- Create: `tests/utils/claude.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/utils/claude.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/claude.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement callClaude**

```typescript
// src/utils/claude.ts
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/claude.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/claude.ts tests/utils/claude.test.ts
git commit -m "feat: add Claude CLI wrapper using child_process.spawn"
```

---

### Task 6: WordPress Client

**Files:**
- Create: `src/utils/wordpress.ts`
- Create: `tests/utils/wordpress.test.ts`

**Step 1: Write the failing test for fetchRecentPosts**

```typescript
// tests/utils/wordpress.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRecentPosts, publishPost } from '../../src/utils/wordpress.js';
import type { WpConfig, ArticleContent } from '../../src/types.js';

const testConfig: WpConfig = {
  siteUrl: 'https://example.com',
  username: 'testuser',
  appPassword: 'test-pass',
};

describe('fetchRecentPosts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches recent posts from WordPress REST API', async () => {
    const mockPosts = [
      { id: 1, title: { rendered: 'Post 1' }, content: { rendered: '<p>Content</p>' }, excerpt: { rendered: '' }, link: 'https://example.com/post-1', date: '2026-01-01' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    });

    const posts = await fetchRecentPosts(testConfig, 5);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts?per_page=5&orderby=date&order=desc',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    expect(posts).toEqual(mockPosts);
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(fetchRecentPosts(testConfig)).rejects.toThrow('WordPress API error: 401');
  });
});

describe('publishPost', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a draft post via WordPress REST API', async () => {
    const article: ArticleContent = {
      title: 'Test Title',
      htmlContent: '<p>Test content</p>',
      metaDescription: 'Test description',
      tags: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 42, link: 'https://example.com/test', status: 'draft' }),
    });

    const result = await publishPost(article, testConfig);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    expect(result).toEqual({ id: 42, link: 'https://example.com/test', status: 'draft' });
  });

  it('sends status as draft', async () => {
    const article: ArticleContent = {
      title: 'Title',
      htmlContent: '<p>Body</p>',
      metaDescription: 'Desc',
      tags: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, link: '', status: 'draft' }),
    });

    await publishPost(article, testConfig);

    const callBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(callBody.status).toBe('draft');
    expect(callBody.title).toBe('Title');
    expect(callBody.content).toBe('<p>Body</p>');
    expect(callBody.excerpt).toBe('Desc');
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(
      publishPost({ title: '', htmlContent: '', metaDescription: '', tags: [] }, testConfig),
    ).rejects.toThrow('WordPress API error: 403');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/wordpress.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement WordPress client**

```typescript
// src/utils/wordpress.ts
import type { WpConfig, WpPost, WpPostResult, ArticleContent } from '../types.js';

function authHeader(config: WpConfig): string {
  const credentials = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function fetchRecentPosts(config: WpConfig, count: number = 5): Promise<WpPost[]> {
  const url = `${config.siteUrl}/wp-json/wp/v2/posts?per_page=${count}&orderby=date&order=desc`;
  const response = await fetch(url, {
    headers: {
      Authorization: authHeader(config),
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  return response.json() as Promise<WpPost[]>;
}

export async function publishPost(article: ArticleContent, config: WpConfig): Promise<WpPostResult> {
  const url = `${config.siteUrl}/wp-json/wp/v2/posts`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader(config),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: article.title,
      content: article.htmlContent,
      status: 'draft',
      excerpt: article.metaDescription,
    }),
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  return response.json() as Promise<WpPostResult>;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/wordpress.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/wordpress.ts tests/utils/wordpress.test.ts
git commit -m "feat: add WordPress REST API client (fetch posts + publish draft)"
```

---

### Task 7: Step 0 — Style Analysis

**Files:**
- Create: `src/steps/styleAnalysis.ts`
- Create: `tests/steps/styleAnalysis.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/steps/styleAnalysis.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildStyleAnalysisPrompt, analyzeStyle } from '../../src/steps/styleAnalysis.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildStyleAnalysisPrompt', () => {
  it('includes article content in the prompt', () => {
    const articles = [
      { title: 'テスト記事', content: 'これはテスト記事の内容です。' },
    ];
    const prompt = buildStyleAnalysisPrompt(articles);

    expect(prompt).toContain('テスト記事');
    expect(prompt).toContain('これはテスト記事の内容です。');
  });

  it('includes instructions for JSON output', () => {
    const prompt = buildStyleAnalysisPrompt([]);
    expect(prompt).toContain('```json');
    expect(prompt).toContain('writingStyle');
  });
});

describe('analyzeStyle', () => {
  it('calls Claude and returns parsed StyleProfile', async () => {
    const mockResponse = `分析結果です。
\`\`\`json
{
  "writingStyle": "丁寧で分かりやすい説明文体",
  "sentenceEndings": ["です", "ます", "でしょう"],
  "tone": "敬体（です・ます調）、親しみやすいトーン",
  "headingPattern": "H2で大テーマ、H3で具体的なトピック",
  "sectionStructure": "導入→問題提起→解説→具体例→まとめ"
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const articles = [{ title: 'Test', content: 'Content' }];
    const result = await analyzeStyle(articles);

    expect(result).toEqual({
      writingStyle: '丁寧で分かりやすい説明文体',
      sentenceEndings: ['です', 'ます', 'でしょう'],
      tone: '敬体（です・ます調）、親しみやすいトーン',
      headingPattern: 'H2で大テーマ、H3で具体的なトピック',
      sectionStructure: '導入→問題提起→解説→具体例→まとめ',
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/styleAnalysis.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement Step 0**

```typescript
// src/steps/styleAnalysis.ts
import type { StyleProfile } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildStyleAnalysisPrompt(
  articles: Array<{ title: string; content: string }>,
): string {
  const articlesText = articles
    .map((a, i) => `### 記事${i + 1}: ${a.title}\n${a.content}`)
    .join('\n\n---\n\n');

  return `あなたは文体分析の専門家です。

以下は WordPress ブログ「programming-zero.net」の既存記事です。これらの記事の文体・スタイルを分析してください。

## 分析対象の記事

${articlesText}

## 分析項目

以下の観点で分析し、JSON形式で出力してください：

1. **writingStyle**: 文体の全体的な特徴（説明的か会話的か、簡潔か詳細か、など）
2. **sentenceEndings**: よく使われる語尾パターン（配列で3〜5個）
3. **tone**: 敬体/常体の判定と、トーンの特徴（親しみやすさ、専門性など）
4. **headingPattern**: H2/H3見出しの使い方パターン（命名規則、粒度など）
5. **sectionStructure**: セクション構成の傾向（導入→本題→まとめ、など）

## 出力形式

\`\`\`json
{
  "writingStyle": "...",
  "sentenceEndings": ["...", "..."],
  "tone": "...",
  "headingPattern": "...",
  "sectionStructure": "..."
}
\`\`\`

JSONのみを出力してください。`;
}

export async function analyzeStyle(
  articles: Array<{ title: string; content: string }>,
): Promise<StyleProfile> {
  const prompt = buildStyleAnalysisPrompt(articles);
  const response = await callClaude(prompt);
  return extractJson<StyleProfile>(response);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/styleAnalysis.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/steps/styleAnalysis.ts tests/steps/styleAnalysis.test.ts
git commit -m "feat: add Step 0 - style analysis from existing WordPress articles"
```

---

### Task 8: Step 1 — Keyword Analysis

**Files:**
- Create: `src/steps/keywordAnalysis.ts`
- Create: `tests/steps/keywordAnalysis.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/steps/keywordAnalysis.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildKeywordAnalysisPrompt, analyzeKeyword } from '../../src/steps/keywordAnalysis.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildKeywordAnalysisPrompt', () => {
  it('includes the keyword in the prompt', () => {
    const prompt = buildKeywordAnalysisPrompt('TypeScript 入門');
    expect(prompt).toContain('TypeScript 入門');
  });

  it('includes 3-stage intent hypothesis instructions', () => {
    const prompt = buildKeywordAnalysisPrompt('test');
    expect(prompt).toContain('表層意図');
    expect(prompt).toContain('潜在意図');
    expect(prompt).toContain('最終ゴール');
  });
});

describe('analyzeKeyword', () => {
  it('calls Claude and returns KeywordAnalysis', async () => {
    const mockResponse = `\`\`\`json
{
  "keyword": "TypeScript 入門",
  "surfaceIntent": "TypeScriptの基本的な書き方を知りたい",
  "latentIntent": "JavaScriptからTypeScriptへ移行したい",
  "finalGoal": "型安全なコードを書けるようになりたい",
  "searchQueries": ["TypeScript 始め方", "TypeScript JavaScript 違い", "TypeScript 環境構築"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await analyzeKeyword('TypeScript 入門');

    expect(result.keyword).toBe('TypeScript 入門');
    expect(result.surfaceIntent).toBeTruthy();
    expect(result.searchQueries).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/keywordAnalysis.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement Step 1**

```typescript
// src/steps/keywordAnalysis.ts
import type { KeywordAnalysis } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildKeywordAnalysisPrompt(keyword: string): string {
  return `あなたはSEO戦略の専門家です。

以下のキーワードについて、検索意図を3段階の仮説で言語化してください。

## 対象キーワード
「${keyword}」

## 分析タスク

1. **表層意図（surfaceIntent）**: ユーザーが文字通り知りたいこと
2. **潜在意図（latentIntent）**: 表面に出ていないが本当に解決したい課題
3. **最終ゴール（finalGoal）**: この検索の先にある理想の状態

さらに、この意図を深く理解するために有用な派生検索クエリを3〜5個生成してください。

## 出力形式

\`\`\`json
{
  "keyword": "${keyword}",
  "surfaceIntent": "...",
  "latentIntent": "...",
  "finalGoal": "...",
  "searchQueries": ["...", "...", "..."]
}
\`\`\`

JSONのみを出力してください。`;
}

export async function analyzeKeyword(keyword: string): Promise<KeywordAnalysis> {
  const prompt = buildKeywordAnalysisPrompt(keyword);
  const response = await callClaude(prompt);
  return extractJson<KeywordAnalysis>(response);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/keywordAnalysis.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/steps/keywordAnalysis.ts tests/steps/keywordAnalysis.test.ts
git commit -m "feat: add Step 1 - keyword intent analysis (3-stage hypothesis)"
```

---

### Task 9: Step 2 — SEO Analysis (with WebSearch)

**Files:**
- Create: `src/steps/seoAnalysis.ts`
- Create: `tests/steps/seoAnalysis.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/steps/seoAnalysis.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildSeoAnalysisPrompt, analyzeSeo } from '../../src/steps/seoAnalysis.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildSeoAnalysisPrompt', () => {
  it('includes keyword analysis context', () => {
    const keywordAnalysis = {
      keyword: 'TypeScript 入門',
      surfaceIntent: '基本を知りたい',
      latentIntent: '移行したい',
      finalGoal: '型安全に書きたい',
      searchQueries: ['TypeScript 始め方', 'TypeScript JavaScript 違い'],
    };
    const prompt = buildSeoAnalysisPrompt(keywordAnalysis);

    expect(prompt).toContain('TypeScript 入門');
    expect(prompt).toContain('TypeScript 始め方');
    expect(prompt).toContain('WebSearch');
  });
});

describe('analyzeSeo', () => {
  it('calls Claude with WebSearch allowed and returns SeoAnalysis', async () => {
    const mockResponse = `\`\`\`json
{
  "topArticles": [
    {"url": "https://example.com/ts-guide", "title": "TS入門ガイド", "summary": "基礎を網羅"}
  ],
  "commonStructure": ["環境構築", "基本構文", "型システム"],
  "mustCoverTopics": ["型定義", "インターフェース", "ジェネリクス"],
  "gapOpportunities": ["実務でのベストプラクティスが不足"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await analyzeSeo({
      keyword: 'TypeScript 入門',
      surfaceIntent: '',
      latentIntent: '',
      finalGoal: '',
      searchQueries: ['TypeScript 始め方'],
    });

    expect(claude.callClaude).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        allowedTools: expect.arrayContaining(['WebSearch', 'WebFetch']),
      }),
    );
    expect(result.topArticles).toHaveLength(1);
    expect(result.commonStructure).toContain('環境構築');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/seoAnalysis.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement Step 2**

```typescript
// src/steps/seoAnalysis.ts
import type { KeywordAnalysis, SeoAnalysis } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildSeoAnalysisPrompt(input: KeywordAnalysis): string {
  const queries = input.searchQueries.map((q) => `- ${q}`).join('\n');

  return `あなたはSEO分析の専門家です。

## コンテキスト
- キーワード: 「${input.keyword}」
- 表層意図: ${input.surfaceIntent}
- 潜在意図: ${input.latentIntent}
- 最終ゴール: ${input.finalGoal}

## タスク

以下の検索クエリでWeb検索を実行し、上位記事を分析してください。

### 検索クエリ
${queries}

**重要: WebSearchツールを使って実際に検索してください。**

### 分析項目
1. 上位記事（最大10件）のURL・タイトル・要約を収集
2. 上位記事に共通する構造パターンを抽出
3. 上位記事が共通してカバーしている必須トピックを特定
4. 上位記事に不足している点（差別化の機会）を特定

## 出力形式

\`\`\`json
{
  "topArticles": [
    {"url": "...", "title": "...", "summary": "..."}
  ],
  "commonStructure": ["..."],
  "mustCoverTopics": ["..."],
  "gapOpportunities": ["..."]
}
\`\`\`

検索を実行した後、上記のJSON形式で結果を出力してください。`;
}

export async function analyzeSeo(input: KeywordAnalysis): Promise<SeoAnalysis> {
  const prompt = buildSeoAnalysisPrompt(input);
  const response = await callClaude(prompt, {
    allowedTools: ['WebSearch', 'WebFetch'],
    maxTurns: 10,
  });
  return extractJson<SeoAnalysis>(response);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/seoAnalysis.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/steps/seoAnalysis.ts tests/steps/seoAnalysis.test.ts
git commit -m "feat: add Step 2 - SEO top article analysis with WebSearch"
```

---

### Task 10: Step 3 — Intent Deep Dive

**Files:**
- Create: `src/steps/intentDeepDive.ts`
- Create: `tests/steps/intentDeepDive.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/steps/intentDeepDive.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildIntentDeepDivePrompt, deepDiveIntent } from '../../src/steps/intentDeepDive.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildIntentDeepDivePrompt', () => {
  it('includes keyword analysis and SEO analysis context', () => {
    const prompt = buildIntentDeepDivePrompt(
      {
        keyword: 'React hooks',
        surfaceIntent: 'hooksの使い方',
        latentIntent: 'クラスコンポーネントから移行',
        finalGoal: 'モダンReact開発',
        searchQueries: [],
      },
      {
        topArticles: [],
        commonStructure: ['useState解説', 'useEffect解説'],
        mustCoverTopics: ['カスタムフック'],
        gapOpportunities: ['パフォーマンス最適化'],
      },
    );

    expect(prompt).toContain('React hooks');
    expect(prompt).toContain('useState解説');
    expect(prompt).toContain('読者の状況');
  });
});

describe('deepDiveIntent', () => {
  it('calls Claude and returns IntentDeepDive', async () => {
    const mockResponse = `\`\`\`json
{
  "readerSituation": "React初心者でクラスコンポーネントに慣れている",
  "readerAnxieties": ["hooks は難しそう", "既存コードの書き換えが大変そう"],
  "decisionBarriers": ["学習コスト", "チーム内の合意"],
  "desiredOutcomes": ["自信を持ってhooksが使えるようになりたい"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await deepDiveIntent(
      { keyword: 'test', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [] },
    );

    expect(result.readerSituation).toBeTruthy();
    expect(result.readerAnxieties).toBeInstanceOf(Array);
    expect(result.decisionBarriers).toBeInstanceOf(Array);
    expect(result.desiredOutcomes).toBeInstanceOf(Array);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/intentDeepDive.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement Step 3**

```typescript
// src/steps/intentDeepDive.ts
import type { KeywordAnalysis, SeoAnalysis, IntentDeepDive } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildIntentDeepDivePrompt(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
): string {
  return `あなたはユーザー心理の専門家です。

## コンテキスト

### キーワード分析
- キーワード: 「${keywordAnalysis.keyword}」
- 表層意図: ${keywordAnalysis.surfaceIntent}
- 潜在意図: ${keywordAnalysis.latentIntent}
- 最終ゴール: ${keywordAnalysis.finalGoal}

### SEO上位記事の分析
- 共通構造: ${seoAnalysis.commonStructure.join('、')}
- 必須トピック: ${seoAnalysis.mustCoverTopics.join('、')}
- 差別化機会: ${seoAnalysis.gapOpportunities.join('、')}

## タスク

このキーワードで検索する読者について、以下を深掘りして言語化してください：

1. **読者の状況（readerSituation）**: 検索時の典型的な状況・背景
2. **読者の不安（readerAnxieties）**: 抱えている不安や懸念（配列で3〜5個）
3. **決断障壁（decisionBarriers）**: 行動に移れない理由（配列で3〜5個）
4. **読後に望む結果（desiredOutcomes）**: 記事を読んだ後どうなりたいか（配列で3〜5個）

## 出力形式

\`\`\`json
{
  "readerSituation": "...",
  "readerAnxieties": ["..."],
  "decisionBarriers": ["..."],
  "desiredOutcomes": ["..."]
}
\`\`\`

JSONのみを出力してください。`;
}

export async function deepDiveIntent(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
): Promise<IntentDeepDive> {
  const prompt = buildIntentDeepDivePrompt(keywordAnalysis, seoAnalysis);
  const response = await callClaude(prompt);
  return extractJson<IntentDeepDive>(response);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/intentDeepDive.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/steps/intentDeepDive.ts tests/steps/intentDeepDive.test.ts
git commit -m "feat: add Step 3 - reader intent deep dive (psychology analysis)"
```

---

### Task 11: Step 4 — Differentiation Design

**Files:**
- Create: `src/steps/differentiation.ts`
- Create: `tests/steps/differentiation.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/steps/differentiation.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  buildDifferentiationPrompt,
  designDifferentiation,
} from '../../src/steps/differentiation.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildDifferentiationPrompt', () => {
  it('includes all previous analysis context', () => {
    const prompt = buildDifferentiationPrompt(
      { keyword: 'Docker 入門', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: ['実運用の知見不足'] },
      { readerSituation: '', readerAnxieties: ['難しそう'], decisionBarriers: [], desiredOutcomes: [] },
    );

    expect(prompt).toContain('Docker 入門');
    expect(prompt).toContain('実運用の知見不足');
    expect(prompt).toContain('難しそう');
    expect(prompt).toContain('構造化');
    expect(prompt).toContain('失敗パターン');
  });
});

describe('designDifferentiation', () => {
  it('calls Claude and returns Differentiation', async () => {
    const mockResponse = `\`\`\`json
{
  "differentiationPoints": [
    {"category": "構造化", "description": "チートシート形式で要点を整理"},
    {"category": "失敗パターン", "description": "初心者がハマりやすい3つの罠"}
  ],
  "uniqueValueProposition": "実務で即使えるDocker環境構築の完全マップ"
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await designDifferentiation(
      { keyword: '', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [] },
      { readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [] },
    );

    expect(result.differentiationPoints).toHaveLength(2);
    expect(result.uniqueValueProposition).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/differentiation.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement Step 4**

```typescript
// src/steps/differentiation.ts
import type {
  KeywordAnalysis,
  SeoAnalysis,
  IntentDeepDive,
  Differentiation,
} from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildDifferentiationPrompt(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
): string {
  return `あなたはコンテンツ戦略の専門家です。

## コンテキスト

### キーワード: 「${keywordAnalysis.keyword}」
- 表層意図: ${keywordAnalysis.surfaceIntent}
- 潜在意図: ${keywordAnalysis.latentIntent}
- 最終ゴール: ${keywordAnalysis.finalGoal}

### 上位記事の状況
- 共通構造: ${seoAnalysis.commonStructure.join('、')}
- 必須トピック: ${seoAnalysis.mustCoverTopics.join('、')}
- 差別化機会: ${seoAnalysis.gapOpportunities.join('、')}

### 読者心理
- 状況: ${intentDeepDive.readerSituation}
- 不安: ${intentDeepDive.readerAnxieties.join('、')}
- 決断障壁: ${intentDeepDive.decisionBarriers.join('、')}
- 望む結果: ${intentDeepDive.desiredOutcomes.join('、')}

## タスク

上位記事を「超える」ための差別化ポイントを、以下の4カテゴリから設計してください：

1. **構造化**: 情報の整理・視覚化・チートシート化
2. **データ**: 具体的な数値・事例・比較データ
3. **因果説明**: 「なぜそうなるのか」の深い説明
4. **失敗パターン**: 読者が陥りやすい失敗とその回避法

全カテゴリを使う必要はありません。効果的なものを選んでください。

## 出力形式

\`\`\`json
{
  "differentiationPoints": [
    {"category": "構造化 | データ | 因果説明 | 失敗パターン", "description": "..."}
  ],
  "uniqueValueProposition": "この記事ならではの価値を一文で"
}
\`\`\`

JSONのみを出力してください。`;
}

export async function designDifferentiation(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
): Promise<Differentiation> {
  const prompt = buildDifferentiationPrompt(keywordAnalysis, seoAnalysis, intentDeepDive);
  const response = await callClaude(prompt);
  return extractJson<Differentiation>(response);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/differentiation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/steps/differentiation.ts tests/steps/differentiation.test.ts
git commit -m "feat: add Step 4 - differentiation design (content strategy)"
```

---

### Task 12: Step 5 — Outline Creation

**Files:**
- Create: `src/steps/outline.ts`
- Create: `tests/steps/outline.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/steps/outline.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildOutlinePrompt, createOutline } from '../../src/steps/outline.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildOutlinePrompt', () => {
  it('includes StyleProfile for section structure', () => {
    const prompt = buildOutlinePrompt(
      { keyword: 'Git 使い方', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: ['基本コマンド'], gapOpportunities: [] },
      { readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [] },
      {
        differentiationPoints: [{ category: '構造化', description: 'フロー図で解説' }],
        uniqueValueProposition: '',
      },
      {
        writingStyle: '丁寧な説明',
        sentenceEndings: ['です', 'ます'],
        tone: '敬体',
        headingPattern: 'H2は疑問形',
        sectionStructure: '導入→解説→まとめ',
      },
    );

    expect(prompt).toContain('H2は疑問形');
    expect(prompt).toContain('導入→解説→まとめ');
    expect(prompt).toContain('共感→問題整理→本質解説→具体策→失敗例→結論');
  });
});

describe('createOutline', () => {
  it('calls Claude and returns ArticleOutline', async () => {
    const mockResponse = `\`\`\`json
{
  "title": "【初心者向け】Git の使い方を完全解説",
  "metaDescription": "Gitの基本から実践まで解説。初心者がつまずくポイントも網羅。",
  "sections": [
    {
      "heading": "Gitとは？なぜ必要なのか",
      "subheadings": ["バージョン管理の重要性", "Gitが選ばれる理由"],
      "keyPoints": ["コードの変更履歴を管理", "チーム開発に必須"]
    }
  ]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await createOutline(
      { keyword: '', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [] },
      { readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [] },
      { differentiationPoints: [], uniqueValueProposition: '' },
      { writingStyle: '', sentenceEndings: [], tone: '', headingPattern: '', sectionStructure: '' },
    );

    expect(result.title).toBeTruthy();
    expect(result.metaDescription).toBeTruthy();
    expect(result.sections).toBeInstanceOf(Array);
    expect(result.sections[0].heading).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/outline.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement Step 5**

```typescript
// src/steps/outline.ts
import type {
  KeywordAnalysis,
  SeoAnalysis,
  IntentDeepDive,
  Differentiation,
  StyleProfile,
  ArticleOutline,
} from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildOutlinePrompt(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
  differentiation: Differentiation,
  styleProfile: StyleProfile,
): string {
  const diffPoints = differentiation.differentiationPoints
    .map((p) => `- [${p.category}] ${p.description}`)
    .join('\n');

  return `あなたは記事設計の専門家です。

## コンテキスト

### キーワード: 「${keywordAnalysis.keyword}」
- 表層意図: ${keywordAnalysis.surfaceIntent}
- 潜在意図: ${keywordAnalysis.latentIntent}
- 最終ゴール: ${keywordAnalysis.finalGoal}

### 必須カバー項目
${seoAnalysis.mustCoverTopics.map((t) => `- ${t}`).join('\n')}

### 読者心理
- 状況: ${intentDeepDive.readerSituation}
- 不安: ${intentDeepDive.readerAnxieties.join('、')}
- 望む結果: ${intentDeepDive.desiredOutcomes.join('、')}

### 差別化ポイント
${diffPoints}
- 独自価値: ${differentiation.uniqueValueProposition}

### ブログのスタイルプロファイル（この形式に合わせる）
- 見出しパターン: ${styleProfile.headingPattern}
- セクション構成: ${styleProfile.sectionStructure}

## タスク

以下のナラティブ構造をベースに、記事アウトラインを作成してください：

**共感→問題整理→本質解説→具体策→失敗例→結論**

スタイルプロファイルの見出しパターンとセクション構成を反映してください。

## 出力形式

\`\`\`json
{
  "title": "記事タイトル（SEO最適化、32文字以内推奨）",
  "metaDescription": "メタディスクリプション（120文字以内）",
  "sections": [
    {
      "heading": "H2見出し",
      "subheadings": ["H3見出し1", "H3見出し2"],
      "keyPoints": ["このセクションで伝える要点1", "要点2"]
    }
  ]
}
\`\`\`

JSONのみを出力してください。`;
}

export async function createOutline(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
  differentiation: Differentiation,
  styleProfile: StyleProfile,
): Promise<ArticleOutline> {
  const prompt = buildOutlinePrompt(
    keywordAnalysis,
    seoAnalysis,
    intentDeepDive,
    differentiation,
    styleProfile,
  );
  const response = await callClaude(prompt);
  return extractJson<ArticleOutline>(response);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/outline.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/steps/outline.ts tests/steps/outline.test.ts
git commit -m "feat: add Step 5 - article outline creation with style profile"
```

---

### Task 13: Step 6 — Article Generation

**Files:**
- Create: `src/steps/articleGeneration.ts`
- Create: `tests/steps/articleGeneration.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/steps/articleGeneration.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  buildArticleGenerationPrompt,
  generateArticle,
} from '../../src/steps/articleGeneration.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildArticleGenerationPrompt', () => {
  it('includes outline and StyleProfile', () => {
    const prompt = buildArticleGenerationPrompt(
      {
        title: 'テスト記事',
        metaDescription: 'テスト',
        sections: [{ heading: 'セクション1', subheadings: ['小見出し'], keyPoints: ['ポイント'] }],
      },
      {
        writingStyle: '丁寧で分かりやすい',
        sentenceEndings: ['です', 'ます'],
        tone: '敬体',
        headingPattern: 'H2で大テーマ',
        sectionStructure: '導入→本題→まとめ',
      },
      'TypeScript 入門',
    );

    expect(prompt).toContain('テスト記事');
    expect(prompt).toContain('セクション1');
    expect(prompt).toContain('丁寧で分かりやすい');
    expect(prompt).toContain('です');
    expect(prompt).toContain('腹落ち');
  });
});

describe('generateArticle', () => {
  it('calls Claude and returns ArticleContent', async () => {
    const mockResponse = `\`\`\`json
{
  "title": "【初心者向け】TypeScript入門ガイド",
  "htmlContent": "<h2>TypeScriptとは</h2><p>TypeScriptは...</p>",
  "metaDescription": "TypeScriptの基本を解説",
  "tags": ["TypeScript", "プログラミング", "入門"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await generateArticle(
      { title: '', metaDescription: '', sections: [] },
      { writingStyle: '', sentenceEndings: [], tone: '', headingPattern: '', sectionStructure: '' },
      'TypeScript',
    );

    expect(result.title).toBeTruthy();
    expect(result.htmlContent).toContain('<h2>');
    expect(result.tags).toBeInstanceOf(Array);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/steps/articleGeneration.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement Step 6**

```typescript
// src/steps/articleGeneration.ts
import type { ArticleOutline, StyleProfile, ArticleContent } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildArticleGenerationPrompt(
  outline: ArticleOutline,
  styleProfile: StyleProfile,
  keyword: string,
): string {
  const sectionsText = outline.sections
    .map(
      (s) =>
        `### ${s.heading}\n小見出し: ${s.subheadings.join('、')}\n要点: ${s.keyPoints.join('、')}`,
    )
    .join('\n\n');

  return `あなたはプロのWebライターです。

## タスク

以下のアウトラインに基づいて、WordPress用のHTML記事本文を生成してください。

## 記事アウトライン

タイトル: ${outline.title}
メタディスクリプション: ${outline.metaDescription}
キーワード: ${keyword}

${sectionsText}

## 文体指示（このブログの既存記事スタイルに合わせる）

- 文体: ${styleProfile.writingStyle}
- 語尾パターン: ${styleProfile.sentenceEndings.join('、')}
- トーン: ${styleProfile.tone}
- 見出しパターン: ${styleProfile.headingPattern}
- セクション構成: ${styleProfile.sectionStructure}

## 執筆方針

- **腹落ち・納得**を重視：「なぜそうなるのか」を丁寧に説明
- 抽象的な説明だけでなく、具体例・コード例・数値を交える
- 読者の不安を先回りして解消する
- H2/H3タグを適切に使用し、WordPress のブロックエディタと互換性のあるHTMLで出力
- タイトルは本文に含めない（WordPressが自動付与するため）

## 出力形式

\`\`\`json
{
  "title": "記事タイトル",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2", "タグ3"]
}
\`\`\`

JSONのみを出力してください。htmlContentにはHTML本文全体を含めてください。`;
}

export async function generateArticle(
  outline: ArticleOutline,
  styleProfile: StyleProfile,
  keyword: string,
): Promise<ArticleContent> {
  const prompt = buildArticleGenerationPrompt(outline, styleProfile, keyword);
  const response = await callClaude(prompt);
  return extractJson<ArticleContent>(response);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/steps/articleGeneration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/steps/articleGeneration.ts tests/steps/articleGeneration.test.ts
git commit -m "feat: add Step 6 - article generation with style profile matching"
```

---

### Task 14: Pipeline Orchestrator

**Files:**
- Create: `src/pipeline.ts`
- Create: `tests/pipeline.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/pipeline.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from '../src/pipeline.js';
import * as wordpress from '../src/utils/wordpress.js';
import * as html from '../src/utils/html.js';
import * as styleAnalysisStep from '../src/steps/styleAnalysis.js';
import * as keywordAnalysisStep from '../src/steps/keywordAnalysis.js';
import * as seoAnalysisStep from '../src/steps/seoAnalysis.js';
import * as intentDeepDiveStep from '../src/steps/intentDeepDive.js';
import * as differentiationStep from '../src/steps/differentiation.js';
import * as outlineStep from '../src/steps/outline.js';
import * as articleGenerationStep from '../src/steps/articleGeneration.js';

vi.mock('../src/utils/wordpress.js');
vi.mock('../src/utils/html.js');
vi.mock('../src/steps/styleAnalysis.js');
vi.mock('../src/steps/keywordAnalysis.js');
vi.mock('../src/steps/seoAnalysis.js');
vi.mock('../src/steps/intentDeepDive.js');
vi.mock('../src/steps/differentiation.js');
vi.mock('../src/steps/outline.js');
vi.mock('../src/steps/articleGeneration.js');

const config = { siteUrl: 'https://example.com', username: 'user', appPassword: 'pass' };

describe('runPipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.mocked(wordpress.fetchRecentPosts).mockResolvedValue([
      { id: 1, title: { rendered: 'Post' }, content: { rendered: '<p>Content</p>' }, excerpt: { rendered: '' }, link: '', date: '' },
    ]);
    vi.mocked(html.stripHtml).mockReturnValue('Content');
    vi.mocked(styleAnalysisStep.analyzeStyle).mockResolvedValue({
      writingStyle: 'test', sentenceEndings: [], tone: 'test', headingPattern: 'test', sectionStructure: 'test',
    });
    vi.mocked(keywordAnalysisStep.analyzeKeyword).mockResolvedValue({
      keyword: 'test', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [],
    });
    vi.mocked(seoAnalysisStep.analyzeSeo).mockResolvedValue({
      topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [],
    });
    vi.mocked(intentDeepDiveStep.deepDiveIntent).mockResolvedValue({
      readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [],
    });
    vi.mocked(differentiationStep.designDifferentiation).mockResolvedValue({
      differentiationPoints: [], uniqueValueProposition: '',
    });
    vi.mocked(outlineStep.createOutline).mockResolvedValue({
      title: 'Test Title', metaDescription: 'Test', sections: [],
    });
    vi.mocked(articleGenerationStep.generateArticle).mockResolvedValue({
      title: 'Test Title', htmlContent: '<p>Test</p>', metaDescription: 'Test', tags: [],
    });
    vi.mocked(wordpress.publishPost).mockResolvedValue({
      id: 42, link: 'https://example.com/test', status: 'draft',
    });
  });

  it('executes all steps in order and returns WordPress result', async () => {
    const result = await runPipeline('テスト', config);

    expect(wordpress.fetchRecentPosts).toHaveBeenCalledWith(config, 5);
    expect(styleAnalysisStep.analyzeStyle).toHaveBeenCalled();
    expect(keywordAnalysisStep.analyzeKeyword).toHaveBeenCalledWith('テスト');
    expect(seoAnalysisStep.analyzeSeo).toHaveBeenCalled();
    expect(intentDeepDiveStep.deepDiveIntent).toHaveBeenCalled();
    expect(differentiationStep.designDifferentiation).toHaveBeenCalled();
    expect(outlineStep.createOutline).toHaveBeenCalled();
    expect(articleGenerationStep.generateArticle).toHaveBeenCalled();
    expect(wordpress.publishPost).toHaveBeenCalled();

    expect(result).toEqual({ id: 42, link: 'https://example.com/test', status: 'draft' });
  });

  it('passes StyleProfile to outline and article generation steps', async () => {
    await runPipeline('テスト', config);

    const outlineCall = vi.mocked(outlineStep.createOutline).mock.calls[0];
    expect(outlineCall[4]).toHaveProperty('writingStyle', 'test');

    const articleCall = vi.mocked(articleGenerationStep.generateArticle).mock.calls[0];
    expect(articleCall[1]).toHaveProperty('writingStyle', 'test');
  });

  it('strips HTML from fetched posts before style analysis', async () => {
    await runPipeline('テスト', config);

    expect(html.stripHtml).toHaveBeenCalledWith('<p>Content</p>');
    const styleAnalysisCall = vi.mocked(styleAnalysisStep.analyzeStyle).mock.calls[0];
    expect(styleAnalysisCall[0][0].content).toBe('Content');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pipeline.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement pipeline**

```typescript
// src/pipeline.ts
import type { WpConfig, WpPostResult } from './types.js';
import { fetchRecentPosts, publishPost } from './utils/wordpress.js';
import { stripHtml } from './utils/html.js';
import { analyzeStyle } from './steps/styleAnalysis.js';
import { analyzeKeyword } from './steps/keywordAnalysis.js';
import { analyzeSeo } from './steps/seoAnalysis.js';
import { deepDiveIntent } from './steps/intentDeepDive.js';
import { designDifferentiation } from './steps/differentiation.js';
import { createOutline } from './steps/outline.js';
import { generateArticle } from './steps/articleGeneration.js';

export async function runPipeline(keyword: string, config: WpConfig): Promise<WpPostResult> {
  // Step 0: Fetch existing articles and analyze writing style
  console.log('[Step 0] 既存記事のスタイルを分析中...');
  const posts = await fetchRecentPosts(config, 5);
  const articles = posts.map((p) => ({
    title: p.title.rendered,
    content: stripHtml(p.content.rendered),
  }));
  const styleProfile = await analyzeStyle(articles);
  console.log('[Step 0] 完了: StyleProfile取得');

  // Step 1: Keyword analysis
  console.log('[Step 1] キーワード構造を分析中...');
  const keywordAnalysis = await analyzeKeyword(keyword);
  console.log('[Step 1] 完了: 検索意図の3段階仮説');

  // Step 2: SEO top article analysis
  console.log('[Step 2] SEO上位記事を分析中...');
  const seoAnalysis = await analyzeSeo(keywordAnalysis);
  console.log(`[Step 2] 完了: ${seoAnalysis.topArticles.length}件の記事を分析`);

  // Step 3: Intent deep dive
  console.log('[Step 3] 検索意図を深掘り中...');
  const intentDeepDive = await deepDiveIntent(keywordAnalysis, seoAnalysis);
  console.log('[Step 3] 完了: 読者心理の分析');

  // Step 4: Differentiation design
  console.log('[Step 4] 差別化ポイントを設計中...');
  const differentiation = await designDifferentiation(keywordAnalysis, seoAnalysis, intentDeepDive);
  console.log('[Step 4] 完了: 差別化戦略');

  // Step 5: Outline creation
  console.log('[Step 5] 記事アウトラインを作成中...');
  const outline = await createOutline(
    keywordAnalysis,
    seoAnalysis,
    intentDeepDive,
    differentiation,
    styleProfile,
  );
  console.log(`[Step 5] 完了: "${outline.title}"`);

  // Step 6: Article generation
  console.log('[Step 6] 記事本文を生成中...');
  const article = await generateArticle(outline, styleProfile, keyword);
  console.log('[Step 6] 完了: HTML本文生成');

  // Publish to WordPress
  console.log('WordPress に下書き投稿中...');
  const result = await publishPost(article, config);
  console.log(`完了: 投稿ID=${result.id}, URL=${result.link}`);

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/pipeline.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pipeline.ts tests/pipeline.test.ts
git commit -m "feat: add pipeline orchestrator (Steps 0-6 + WordPress publish)"
```

---

### Task 15: CLI Entry Point

**Files:**
- Create: `src/cli.ts`
- Create: `tests/cli.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/cli.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WpConfig } from '../src/types.js';

// Mock pipeline before importing cli
vi.mock('../src/pipeline.js', () => ({
  runPipeline: vi.fn(),
}));

describe('CLI', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;
  const originalExit = process.exit;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

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
    process.exit = vi.fn() as any;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    process.exit = originalExit;
  });

  it('calls runPipeline with keyword from argv and config from env', async () => {
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
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('exits with error when env vars are missing', async () => {
    process.argv = ['node', 'cli.ts', 'keyword'];
    delete process.env.WP_SITE_URL;

    const { main } = await import('../src/cli.js');
    await main();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('WP_SITE_URL'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli.test.ts`
Expected: FAIL — cannot find module

**Step 3: Implement CLI**

```typescript
// src/cli.ts
import 'dotenv/config';
import type { WpConfig } from './types.js';
import { runPipeline } from './pipeline.js';

export async function main(): Promise<void> {
  const keyword = process.argv[2];

  if (!keyword) {
    console.error('エラー: キーワードを指定してください。\n使い方: npm run generate -- "キーワード"');
    process.exit(1);
    return;
  }

  const requiredEnvVars = ['WP_SITE_URL', 'WP_USERNAME', 'WP_APP_PASSWORD'] as const;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`エラー: 環境変数 ${envVar} が設定されていません。.env ファイルを確認してください。`);
      process.exit(1);
      return;
    }
  }

  const config: WpConfig = {
    siteUrl: process.env.WP_SITE_URL!,
    username: process.env.WP_USERNAME!,
    appPassword: process.env.WP_APP_PASSWORD!,
  };

  try {
    console.log(`記事生成を開始: "${keyword}"\n`);
    const result = await runPipeline(keyword, config);
    console.log(`\n✓ 記事を下書き投稿しました`);
    console.log(`  投稿ID: ${result.id}`);
    console.log(`  URL: ${result.link}`);
    console.log(`  ステータス: ${result.status}`);
  } catch (error) {
    console.error('エラー:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cli.test.ts`
Expected: PASS

**Step 5: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/cli.ts tests/cli.test.ts
git commit -m "feat: add CLI entry point with env validation and error handling"
```

---

### Task 16: Manual Integration Test

This task is NOT TDD — it validates the full pipeline end-to-end with real WordPress and Claude Code.

**Step 1: Set up .env file**

Copy `.env.example` to `.env` and fill in real WordPress credentials.

**Step 2: Verify Claude CLI is available**

Run: `claude --version`
Expected: Version number printed (confirms Claude Code is installed and authenticated)

**Step 3: Run the generator**

Run: `npm run generate -- "TypeScript 入門"`
Expected:
- Console shows step-by-step progress (Step 0 → Step 6)
- Draft post created on WordPress
- Post URL printed at the end

**Step 4: Verify the draft on WordPress**

Open the printed URL in browser. Confirm:
- Title is present
- Content has proper H2/H3 structure
- Writing style matches existing blog posts
- Status is "draft"

**Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: finalize integration and adjust prompts based on real testing"
```

---

## Summary

| Task | Description | Test File |
|------|-------------|-----------|
| 1 | Project setup (package.json, tsconfig, vitest, .env) | — |
| 2 | Type definitions | `tests/types.test.ts` |
| 3 | HTML stripping utility | `tests/utils/html.test.ts` |
| 4 | JSON extraction utility | `tests/utils/json.test.ts` |
| 5 | Claude CLI wrapper | `tests/utils/claude.test.ts` |
| 6 | WordPress REST API client | `tests/utils/wordpress.test.ts` |
| 7 | Step 0: Style analysis | `tests/steps/styleAnalysis.test.ts` |
| 8 | Step 1: Keyword analysis | `tests/steps/keywordAnalysis.test.ts` |
| 9 | Step 2: SEO analysis (WebSearch) | `tests/steps/seoAnalysis.test.ts` |
| 10 | Step 3: Intent deep dive | `tests/steps/intentDeepDive.test.ts` |
| 11 | Step 4: Differentiation design | `tests/steps/differentiation.test.ts` |
| 12 | Step 5: Outline creation | `tests/steps/outline.test.ts` |
| 13 | Step 6: Article generation | `tests/steps/articleGeneration.test.ts` |
| 14 | Pipeline orchestrator | `tests/pipeline.test.ts` |
| 15 | CLI entry point | `tests/cli.test.ts` |
| 16 | Manual integration test | — |

**Total estimated commits:** 16
