レポートファイルへの書き込みは自動フェーズで処理されます。調査結果と実装計画を以下にまとめます。

---

## 実装計画: programming-zero.net 記事自動生成システム

### Open Questions の解決

#### Claude Code エージェント呼び出し方式

**調査結果:**
- `claude` CLI: `/Users/nobuyoshishimmen/.local/bin/claude` (v2.1.63) — 確認済
- `@anthropic-ai/claude-agent-sdk` (v0.2.63): npm に公開済
- SDK の `Options` 型に `pathToClaudeCodeExecutable` オプションが存在 → **SDK は内部で `claude` バイナリをラップするアーキテクチャ**

**決定: `@anthropic-ai/claude-agent-sdk` を採用**

根拠:
1. SDK が `claude` バイナリを内部起動するため、Claude Code サブスクリプション認証がそのまま有効（API キー不要）
2. `outputFormat: { type: 'json_schema', schema: {...} }` で構造化 JSON 出力をネイティブサポート
3. `allowedTools: []` で推論専用モードに設定可能
4. `env: { ...process.env, CLAUDECODE: undefined }` でネストセッションエラーを回避

#### Web 検索 API の選定

| API | 月間無料枠 | AI最適化 | 構造化レスポンス | 採用 |
|-----|----------|---------|----------------|------|
| **Tavily** | 1,000回 | ✅ AI向け設計 | ✅ content抜粋付き | **採用** |
| Brave Search | 2,000回 | △ | △ スニペットのみ | — |
| SerpAPI | 100回 | △ | ✅ Google SERP | — |

**Tavily採用**: AI エージェント向け設計で `content` フィールドの品質が高い。`searchDepth: 'advanced'` で深い解析が可能。

---

### ディレクトリ・ファイル構成

```
programming-zero/
├── docs/
│   └── architecture.md              # 新規: 7セクション設計ドキュメント
├── src/
│   ├── types/
│   │   └── index.ts                 # 新規: 全共有型定義 (~80行)
│   ├── infrastructure/
│   │   ├── claude.ts                # 新規: Agent SDK ラッパー callAgent<T> (~80行)
│   │   ├── search.ts                # 新規: Tavily クライアント (~60行)
│   │   └── wordpress.ts             # 新規: WordPress REST API クライアント (~100行)
│   ├── agents/
│   │   ├── keywordAnalysis.ts       # Step1: キーワード構造理解 (~80行)
│   │   ├── seoAnalysis.ts           # Step2: SEO上位記事分析 (~100行)
│   │   ├── intentDeepDive.ts        # Step3: 検索意図の深掘り (~80行)
│   │   ├── differentiationDesign.ts # Step4: 差別化ポイント設計 (~80行)
│   │   ├── outlineCreation.ts       # Step5: 記事アウトライン作成 (~80行)
│   │   └── articleGeneration.ts     # Step6: 本文生成 + WordPress投稿 (~100行)
│   ├── pipeline.ts                  # オーケストレーター (~80行)
│   └── cli.ts                       # CLIエントリーポイント (~40行)
├── tests/
│   ├── infrastructure/{claude,search,wordpress}.test.ts
│   ├── agents/{keywordAnalysis,...,articleGeneration}.test.ts
│   └── pipeline.test.ts
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

### TypeScript 型定義設計 (`src/types/index.ts`)

各エージェントは前ステップの出力型を **immutable に拡張** するパターン:

```typescript
// Step1 I/O
interface KeywordAnalysisInput { keyword: string }
interface KeywordAnalysisOutput {
  keyword: string;
  surfaceIntent: string;    // 表層意図
  latentIntent: string;     // 潜在意図
  finalGoal: string;        // 最終ゴール
  searchQueries: string[];  // Tavily検索クエリ (3〜5個)
}

// Step2 I/O
interface ArticleSource { url: string; title: string; content: string }
interface SeoAnalysisOutput extends KeywordAnalysisOutput {
  topArticles: ArticleSource[];
  commonStructure: string[];
  mustCoverTopics: string[];
  gapOpportunities: string[];
}

// Step3〜5: 同様のパターンで順次拡張
interface IntentDeepDiveOutput extends SeoAnalysisOutput {
  readerSituation: string; readerAnxieties: string[];
  decisionBarriers: string[]; desiredOutcomes: string[];
}
interface DifferentiationOutput extends IntentDeepDiveOutput { ... }
interface OutlineOutput extends DifferentiationOutput {
  title: string; metaDescription: string; sections: OutlineSection[];
}

// Step6 I/O
interface ArticleContent { title: string; htmlContent: string; slug: string; excerpt: string; tags: string[] }
interface WordPressPostResult { id: number; link: string; status: 'publish' | 'draft' }
```

---

### インフラ層設計

#### `src/infrastructure/claude.ts`

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

export async function callAgent<T>(options: {
  systemPrompt: string;
  userPrompt: string;
  outputSchema: Record<string, unknown>;
}): Promise<T> {
  const env = { ...process.env, CLAUDECODE: undefined };
  let resultText: string | undefined;

  for await (const message of query({
    prompt: options.userPrompt,
    options: {
      systemPrompt: options.systemPrompt,
      allowedTools: [],               // 推論のみ
      permissionMode: 'bypassPermissions',
      outputFormat: { type: 'json_schema', schema: options.outputSchema },
      env,
    },
  })) {
    if ('result' in message && typeof message.result === 'string') {
      resultText = message.result;
    }
  }

  if (!resultText) throw new Error('Agent returned no result');
  return JSON.parse(resultText) as T;
}
```

#### `src/infrastructure/wordpress.ts`

**使用エンドポイント**:
- `POST /wp-json/wp/v2/posts` — 記事投稿
- `GET /wp-json/wp/v2/tags?search={name}` — タグ検索
- `POST /wp-json/wp/v2/tags` — タグ作成

**認証**: `Authorization: Basic base64("username:appPassword")`  
Node.js ネイティブ `fetch` を使用（`node-fetch` 不要）

---

### パイプライン設計 (`src/pipeline.ts`)

```typescript
export async function runPipeline(keyword: string): Promise<WordPressPostResult> {
  console.error('[1/6] キーワード構造理解...');
  const step1 = await analyzeKeyword({ keyword });
  console.error('[2/6] SEO上位記事分析...');
  const step2 = await analyzeSeoTop(step1);    // Tavily検索 → Claude分析
  console.error('[3/6] 検索意図の深掘り...');
  const step3 = await deepDiveIntent(step2);
  console.error('[4/6] 差別化ポイント設計...');
  const step4 = await designDifferentiation(step3);
  console.error('[5/6] 記事アウトライン作成...');
  const step5 = await createOutline(step4);
  console.error('[6/6] 本文生成・WordPress投稿...');
  return generateAndPublish(step5);
}
```

**Step2のみ特殊**: TypeScript で Tavily 検索 → 結果を Claude に渡して分析。他ステップは純粋な Claude 推論。

---

### package.json 依存関係

```json
{
  "type": "module",
  "scripts": { "generate": "tsx src/cli.ts" },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.2.63",
    "@tavily/core": "^0.7.2",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0", "@types/node": "^22.0.0",
    "tsx": "^4.0.0", "vitest": "^2.0.0"
  }
}
```

---

### Coder向け重要事項

**絶対禁止アンチパターン**:
1. `@anthropic-ai/sdk` の使用 — API キーが必要なため使用禁止
2. 各エージェントから `query()` を直接呼ぶこと — 必ず `callAgent()` 経由
3. パイプラインデータの直接ミューテーション — `{ ...prev, newField }` パターンを使うこと
4. `node-fetch` の追加 — Node.js 18+ のネイティブ `fetch` を使う
5. TODO コメント — `resolveTagIds` 含め全て完全実装すること

**ESM 対応**: `"type": "module"` のため相対インポートに `.js` 拡張子必須  
**環境変数**: `cli.ts` 先頭で `import 'dotenv/config'`  
**進捗ログ**: `console.error` へ（stdout は最終 JSON のみ）  
**WordPress投稿**: 初回は `status: 'draft'` で投稿