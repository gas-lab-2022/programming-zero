# アーキテクチャ設計書

## 概要

`programming-zero.net`（WordPress）向け記事自動生成システム。Claude Code サブスクリプションを AI ランタイムとして使用し、6 ステップのマルチエージェントパイプラインで SEO 最適化された記事を生成・公開する。

---

## 1. エージェント構成

### パイプライン概要

```
キーワード入力
    ↓
Step 1: analyzeKeyword   — キーワード構造理解エージェント
    ↓
Step 2: analyzeSeoTop    — SEO上位記事分析エージェント
    ↓
Step 3: deepDiveIntent   — 検索意図深掘りエージェント
    ↓
Step 4: designDifferentiation — 差別化ポイント設計エージェント
    ↓
Step 5: createOutline    — 記事アウトライン作成エージェント
    ↓
Step 6: generateAndPublish — 本文生成＆WordPress投稿エージェント
    ↓
WordPress記事（Draft）
```

### 各エージェントの定義

| エージェント | 役割 | ペルソナ |
|---|---|---|
| `analyzeKeyword` | キーワードの表層意図・潜在意図・最終ゴールを言語化し、検索クエリを生成 | SEO戦略の専門家 |
| `analyzeSeoTop` | Tavilyで上位10記事を取得し、共通構造・必須カバー項目・不足点を抽出 | SEO分析の専門家 |
| `deepDiveIntent` | 読者の状況・不安・決断障壁・読後に望む結果を言語化 | ユーザー心理の専門家 |
| `designDifferentiation` | 構造化・データ・因果説明・失敗パターンで上位記事を超える設計 | コンテンツ戦略の専門家 |
| `createOutline` | 共感→問題整理→本質解説→具体策→失敗例→結論の構造でアウトライン作成 | 記事設計の専門家 |
| `generateAndPublish` | 「腹落ち・納得」重視の文体でHTML本文生成、WordPress REST APIで公開 | プロのライター |

### オーケストレーション方法

- TypeScript（`src/pipeline.ts`）が各エージェントを**順次呼び出す**
- 各エージェントの出力は次エージェントの入力に引き継がれる（スノーボール型累積データ）
- エラーが発生した場合は即時伝播（Fail Fast）

---

## 2. データフロー

### 型定義（TypeScript）

各エージェントの出力は前ステップの出力を継承し、新しいフィールドを追加する。

```typescript
// Step 1 入力
interface KeywordAnalysisInput {
  keyword: string
}

// Step 1 出力
interface KeywordAnalysisOutput {
  keyword: string
  surfaceIntent: string     // 表層意図
  latentIntent: string      // 潜在意図
  finalGoal: string         // 最終ゴール
  searchQueries: string[]   // 検索クエリ（3〜5個）
}

// Step 2 出力（Step 1 を継承）
interface SeoAnalysisOutput extends KeywordAnalysisOutput {
  topArticles: ArticleSource[]    // 上位記事（URL, タイトル, 内容）
  commonStructure: string[]       // 上位記事の共通構造
  mustCoverTopics: string[]       // 必須カバー項目
  gapOpportunities: string[]      // ギャップ（上位記事の不足点）
}

// Step 3 出力（Step 2 を継承）
interface IntentDeepDiveOutput extends SeoAnalysisOutput {
  readerSituation: string         // 読者の状況
  readerAnxieties: string[]       // 読者の不安
  decisionBarriers: string[]      // 決断障壁
  desiredOutcomes: string[]       // 読後に望む結果
}

// Step 4 出力（Step 3 を継承）
interface DifferentiationOutput extends IntentDeepDiveOutput {
  differentiationPoints: DifferentiationPoint[]  // 差別化ポイント
  uniqueValueProposition: string                 // ユニーク価値提案
}

// Step 5 出力（Step 4 を継承）
interface OutlineOutput extends DifferentiationOutput {
  title: string                   // 記事タイトル
  metaDescription: string         // メタディスクリプション
  sections: OutlineSection[]      // セクション構成
}

// Step 6 出力（WordPress投稿結果）
interface WordPressPostResult {
  id: number
  link: string
  status: 'publish' | 'draft'
}
```

### 各エージェントの Input / Output

| Step | Input | Output |
|---|---|---|
| 1 | `KeywordAnalysisInput` | `KeywordAnalysisOutput` |
| 2 | `KeywordAnalysisOutput` | `SeoAnalysisOutput` |
| 3 | `SeoAnalysisOutput` | `IntentDeepDiveOutput` |
| 4 | `IntentDeepDiveOutput` | `DifferentiationOutput` |
| 5 | `DifferentiationOutput` | `OutlineOutput` |
| 6 | `OutlineOutput` | `WordPressPostResult` |

---

## 3. AI と TypeScript の責務分担

### Claude Code（`@anthropic-ai/claude-agent-sdk`）が担う処理

- キーワードの意図分析（表層・潜在・最終ゴールの言語化）
- 上位記事の構造分析（共通パターン抽出、ギャップ同定）
- 読者心理の推定（不安・障壁・望む結果）
- 差別化戦略の策定（独自角度・価値提案）
- 記事アウトラインの設計（ナラティブ構造）
- HTML記事本文の生成（「腹落ち・納得」文体）

### TypeScript が担う処理

- 外部 API 連携（Tavily Web 検索、WordPress REST API）
- データオーケストレーション（エージェント間のデータ受け渡し）
- エラーハンドリングとプロセス制御
- 環境変数管理（dotenv）
- CLI インターフェース
- JSON スキーマ検証（claude-agent-sdk の outputFormat 機能）

---

## 4. Web 検索 API の選定

### 比較

| API | 特徴 | コスト |
|---|---|---|
| **Tavily** | AI 検索特化、高品質なコンテンツ抽出、Node.js SDK あり | 従量課金（月1000リクエスト無料） |
| Brave Search | 独立インデックス、プライバシー重視 | 月2000リクエスト無料 |
| SerpAPI | Google 結果を取得、信頼性高い | $50/月〜 |

### 採用: Tavily

**理由:**
- **AI 用途に最適化**: 記事本文まで取得できる `includeRawContent` オプション
- **`searchDepth: 'advanced'`** で高品質なコンテンツを取得可能
- **公式 Node.js SDK** (`@tavily/core`) が提供されており、TypeScript 型定義済み
- 無料枠があり初期開発コストを最小化できる

---

## 5. WordPress REST API 連携層

### 認証: Application Passwords

```
Authorization: Basic base64(username:app_password)
```

WordPress 5.6 以降で標準搭載。管理画面 → ユーザー → アプリケーションパスワードで生成。

### 使用エンドポイント

| エンドポイント | メソッド | 用途 |
|---|---|---|
| `GET /wp-json/wp/v2/tags?search={name}` | GET | タグの検索 |
| `POST /wp-json/wp/v2/tags` | POST | 新規タグ作成 |
| `POST /wp-json/wp/v2/posts` | POST | 記事の投稿 |

### 投稿モジュールの設計（`src/infrastructure/wordpress.ts`）

```
publishPost(content, config)
  ├── resolveTagId(tagName, config)  ← タグごとに検索→なければ作成
  │   ├── GET /wp/v2/tags?search={name}  → found: return id
  │   └── POST /wp/v2/tags              → created: return id
  └── POST /wp/v2/posts (status: 'draft')
```

- 記事は常に **Draft** 状態で投稿（公開は手動）
- タグは逐次処理（順序保証のため）

---

## 6. ディレクトリ・モジュール構成

```
src/
├── cli.ts                    # CLIエントリーポイント
├── pipeline.ts               # パイプラインオーケストレーター
├── types/
│   └── index.ts              # 全共有型定義
├── agents/
│   ├── keywordAnalysis.ts    # Step 1: キーワード構造理解
│   ├── seoAnalysis.ts        # Step 2: SEO上位記事分析
│   ├── intentDeepDive.ts     # Step 3: 検索意図深掘り
│   ├── differentiationDesign.ts  # Step 4: 差別化ポイント設計
│   ├── outlineCreation.ts    # Step 5: アウトライン作成
│   └── articleGeneration.ts  # Step 6: 本文生成＆WordPress投稿
└── infrastructure/
    ├── claude.ts             # Claude Code SDK ラッパー（callAgent）
    ├── search.ts             # Tavily Web 検索ラッパー（searchWeb）
    └── wordpress.ts          # WordPress REST API ラッパー（publishPost）

tests/
├── agents/                   # 各エージェントのユニットテスト
├── infrastructure/           # インフラ層のユニットテスト
├── integration/              # パイプライン統合テスト
└── pipeline.test.ts          # パイプラインオーケストレーターのテスト

docs/
└── architecture.md           # 本設計書
```

### 各モジュールの責務

| モジュール | 責務 |
|---|---|
| `cli.ts` | 引数パース、dotenv 読み込み、`runPipeline` 呼び出し |
| `pipeline.ts` | 6エージェントの順次呼び出しと結果受け渡し |
| `agents/*` | AI プロンプト設計、Claude への指示、出力スキーマ定義 |
| `infrastructure/claude.ts` | `query()` 呼び出し、結果抽出、JSON パース |
| `infrastructure/search.ts` | Tavily クライアント管理、結果のマッピング、URL重複排除 |
| `infrastructure/wordpress.ts` | 認証ヘッダー生成、タグ解決、記事投稿 |
| `types/index.ts` | 全モジュール共通の型定義 |

---

## 7. CLI エントリーポイント設計

### コマンド

```bash
npm run generate -- "キーワード"
```

### フロー

```
1. process.argv[2] からキーワード取得
   └── 未指定の場合: エラーメッセージを出力して exit(1)
2. dotenv.config() で .env を読み込む
3. runPipeline(keyword) を呼び出す
4. 完了後: 投稿ID・URL・ステータスをコンソール出力
   └── エラー時: エラーメッセージを出力して exit(1)
```

### 環境変数（`.env`）

```env
# WordPress接続情報
WP_SITE_URL=https://programming-zero.net
WP_USERNAME=your_wordpress_username
WP_APP_PASSWORD=your_application_password

# Tavily Web検索API
TAVILY_API_KEY=your_tavily_api_key
```
