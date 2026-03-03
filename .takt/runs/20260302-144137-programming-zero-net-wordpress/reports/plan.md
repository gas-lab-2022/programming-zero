# Task Plan

## Original Request

`programming-zero.net`（WordPress）向けの記事自動生成システムをゼロから構築する。**まず `docs/architecture.md` を設計ドキュメントとして新規作成し、その設計に基づきシステムを実装する。**

制約:
- **言語**: TypeScript
- **AI ランタイム**: Claude Code サブスクリプション（外部 API キー不使用）
- **CLI エントリーポイント**: `npm run generate -- "キーワード"`
- **WordPress 認証**: Application Passwords（`.env` 管理）

---

## Analysis

### Objective

キーワードを受け取り、6ステップのマルチエージェントパイプラインで記事を生成し、WordPress に自動投稿する CLI ツールを TypeScript で構築する。先に `docs/architecture.md` を作成し、その設計に従って実装する。

### Scope

ゼロ起点の新規構築。影響範囲は作業ディレクトリ全体（既存ソースコードなし）。

---

### Approaches Considered

| アプローチ | 採用 | 根拠 |
|----------|------|------|
| `@anthropic-ai/claude-agent-sdk` を使用 | **採用** | SDK は内部で `claude` バイナリをラップ（`pathToClaudeCodeExecutable` オプションが証拠）するため、Claude Code サブスクリプション認証がそのまま有効。`outputFormat: { type: 'json_schema' }` で構造化出力をネイティブサポートし、型安全で堅牢 |
| `claude -p` 生サブプロセス | 非採用 | SDK より低レベルで JSON パースや subprocess 管理を手動実装する必要がある。SDK が同等の機能を提供するため不要 |
| `@anthropic-ai/sdk`（Client SDK）| 禁止 | API キーが必要なため、ユーザー要件「外部 API キーは使用しない」に違反 |
| Tavily（Web 検索 API）| **採用** | AI エージェント向け設計で `content` 抜粋の品質が高い。1,000回/月無料枠（1記事あたり5〜10クエリの用途に十分）。`searchDepth: 'advanced'` で高品質な結果取得が可能 |
| Brave Search API | 非採用 | AI 最適化なし、スニペットのみで本文抜粋なし |
| SerpAPI | 非採用 | 無料枠100回/月は不十分 |

---

### Implementation Approach

#### Claude 呼び出し方式の確定

```
@anthropic-ai/claude-agent-sdk (v0.2.63) の query() 関数を使用
- allowedTools: []          → 推論専用（ツール不使用）
- outputFormat: json_schema → 構造化 JSON 出力を強制
- env: { CLAUDECODE: undefined } → 開発中のネストセッションエラー回避
- permissionMode: 'bypassPermissions'
```

#### ファイル構成

```
docs/
└── architecture.md              # 新規: 7セクション設計ドキュメント

src/
├── types/
│   └── index.ts                 # 全パイプライン型定義 (~80行)
├── infrastructure/
│   ├── claude.ts                # callAgent<T>() ラッパー (~80行)
│   ├── search.ts                # Tavily クライアント searchWeb() (~60行)
│   └── wordpress.ts             # WordPress REST API createPost() (~100行)
├── agents/
│   ├── keywordAnalysis.ts       # Step1: キーワード構造理解 (~80行)
│   ├── seoAnalysis.ts           # Step2: SEO上位記事分析 (~100行)
│   ├── intentDeepDive.ts        # Step3: 検索意図の深掘り (~80行)
│   ├── differentiationDesign.ts # Step4: 差別化ポイント設計 (~80行)
│   ├── outlineCreation.ts       # Step5: 記事アウトライン作成 (~80行)
│   └── articleGeneration.ts     # Step6: 本文生成 + WordPress投稿 (~100行)
├── pipeline.ts                  # 6ステップオーケストレーター (~80行)
└── cli.ts                       # CLIエントリーポイント (~40行)

tests/
├── infrastructure/{claude,search,wordpress}.test.ts
├── agents/{keywordAnalysis,seoAnalysis,...,articleGeneration}.test.ts
└── pipeline.test.ts

package.json / tsconfig.json / .env.example / .gitignore
```

各ファイルは200行以下を目標、300行を超えないこと（アーキテクチャ知識制約）。

#### TypeScript 型設計（immutable 継承パターン）

```typescript
// パイプライン各ステップは前ステップ出力を拡張
interface KeywordAnalysisOutput {
  keyword: string;
  surfaceIntent: string;    // 表層意図
  latentIntent: string;     // 潜在意図
  finalGoal: string;        // 最終ゴール
  searchQueries: string[];  // Tavily検索クエリ (3〜5個)
}
interface SeoAnalysisOutput extends KeywordAnalysisOutput {
  topArticles: ArticleSource[];
  commonStructure: string[];
  mustCoverTopics: string[];
  gapOpportunities: string[];
}
interface IntentDeepDiveOutput extends SeoAnalysisOutput { ... }
interface DifferentiationOutput extends IntentDeepDiveOutput { ... }
interface OutlineOutput extends DifferentiationOutput {
  title: string; metaDescription: string; sections: OutlineSection[];
}
interface ArticleContent { title: string; htmlContent: string; slug: string; excerpt: string; tags: string[] }
interface WordPressPostResult { id: number; link: string; status: 'publish' | 'draft' }
```

#### 各層の責務分担

| 処理 | 担当 |
|------|------|
| 検索意図分析・心理分析・差別化設計・構成設計・本文生成 | Claude（`callAgent` 経由）|
| Tavily 検索 API 呼び出し・結果の前処理・重複除去 | TypeScript |
| WordPress REST API 呼び出し・タグ解決・HTTP エラー処理 | TypeScript |
| パイプラインオーケストレーション・CLI 引数処理・env バリデーション | TypeScript |

#### Step 2 の特殊実装

Step 2 のみ TypeScript が先に Tavily 検索を実行し、その結果を Claude に渡す:
```typescript
// seoAnalysis.ts
const searchResults = await Promise.all(input.searchQueries.map(q => searchWeb(q, 5)));
const topArticles = deduplicateByUrl(searchResults.flat()).slice(0, 10);
// → topArticles を含む userPrompt を組み立てて callAgent() に渡す
```

#### WordPress 連携

- 認証: `Authorization: Basic base64("username:appPassword")`
- 使用エンドポイント:
  - `POST /wp-json/wp/v2/posts` — 記事投稿
  - `GET /wp-json/wp/v2/tags?search={name}` — タグ検索
  - `POST /wp-json/wp/v2/tags` — タグ作成（存在しない場合）
- HTTP クライアント: Node.js 18+ ネイティブ `fetch`（`node-fetch` 不要）
- 初回投稿は `status: 'draft'`

#### package.json

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
    "typescript": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "vitest": "^2.0.0"
  }
}
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

## Implementation Guidelines

### 実装パターン（全エージェント共通）

```typescript
// agents/keywordAnalysis.ts 実装パターン（他エージェントも同様）
const SYSTEM_PROMPT = `あなたはSEO戦略の専門家です。...`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: { surfaceIntent: { type: 'string' }, ... },
  required: ['surfaceIntent', 'latentIntent', 'finalGoal', 'searchQueries'],
};

export async function analyzeKeyword(input: KeywordAnalysisInput): Promise<KeywordAnalysisOutput> {
  return callAgent<KeywordAnalysisOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `キーワード「${input.keyword}」の検索意図を3段階で分析してください。...`,
    outputSchema: OUTPUT_SCHEMA,
  });
}
```

### 厳禁アンチパターン

1. **`@anthropic-ai/sdk` の使用禁止** — API キーが必要なため。必ず `@anthropic-ai/claude-agent-sdk` を使うこと
2. **各エージェントから `query()` を直接呼ぶこと禁止** — 必ず `callAgent()` ラッパー経由（Operation Discoverability 原則）
3. **パイプラインデータの直接ミューテーション禁止** — `{ ...prev, newField }` スプレッドパターンを使うこと
4. **`node-fetch` の追加禁止** — Node.js 18+ ネイティブ `fetch` を使う
5. **TODO コメント禁止** — `resolveTagIds` 含め全ファイルを完全実装すること
6. **stdout へのログ出力禁止** — 進捗は `console.error`、stdout は最終 JSON のみ

### ESM 対応

`"type": "module"` 設定のため相対インポートに `.js` 拡張子が必須:
```typescript
import { callAgent } from '../infrastructure/claude.js';  // ✅
import { callAgent } from '../infrastructure/claude';     // ❌ ビルドエラー
```

### CLI 環境変数バリデーション

```typescript
// cli.ts
import 'dotenv/config';  // 先頭で読み込み

const requiredEnvVars = ['WP_SITE_URL', 'WP_USERNAME', 'WP_APP_PASSWORD', 'TAVILY_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in .env`);
    process.exit(1);
  }
}
```

### テスト設計ガイド（write_tests movement 向け）

| 対象 | モック対象 |
|------|----------|
| `claude.ts` | `@anthropic-ai/claude-agent-sdk` の `query` 関数をモック |
| `search.ts` | `@tavily/core` の `tavily()` をモック |
| `wordpress.ts` | `global.fetch` をモック |
| `agents/*.ts` | `callAgent` 関数をモック、プロンプト構築と型変換を検証 |
| `pipeline.ts` | 全エージェント関数をモック、シーケンスと引数受け渡しを検証 |

**必須テストケース**:
- 正常系: 正しい入力に対して型安全な出力が返ること
- エラー系: `callAgent` 例外時のエラー伝播
- WordPress API 非200レスポンス時の意味あるエラー throw
- 環境変数未設定時の `process.exit(1)` 呼び出し

### `docs/architecture.md` 必須セクション

以下の7セクションをすべて含めること:
1. エージェント構成（6エージェントの定義・役割・ペルソナ・オーケストレーション方法）
2. データフロー（TypeScript 型レベルの I/O 定義、エージェント間データ受け渡し図）
3. AI と TypeScript の責務分担（Claude が担う処理 vs TypeScript が担う処理）
4. Web 検索 API の選定（Tavily 採用理由、比較表含む）
5. WordPress REST API 連携層（認証方式、使用エンドポイント一覧、投稿モジュール設計）
6. ディレクトリ・モジュール構成（ディレクトリ構造と各ファイルの責務）
7. CLI エントリーポイント設計（キーワード受け取りから投稿完了までのフロー）

---

## Out of Scope

| 項目 | 除外理由 |
|------|---------|
| 記事の公開（publish）| 初回はドラフト投稿し、人間が確認後に公開するフロー。ユーザー指定なし |
| カテゴリー設定 | ユーザー要件に明示なし。タグのみ対応 |
| 画像生成・アイキャッチ | ユーザー要件に明示なし |
| リトライ機構 | ユーザー要件に明示なし。SDK デフォルト動作に委ねる |
| ログファイル出力 | ユーザー要件に明示なし |

---

## Open Questions

なし（全 Open Questions は調査により解決済）。