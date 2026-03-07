# article-pipeline

WordPress ブログの記事生成パイプライン。Claude Code のスキルで SEO 最適化された日本語記事を生成・リライト・編集し、PR ベースのレビューを経て GitHub Actions で WordPress に自動投稿する。

## Setup

### Prerequisites

- Node.js 20+
- [Claude Code](https://claude.ai/code)

### Install

```bash
npm install
cp .env.example .env
# .env を編集して WordPress 接続情報を設定
```

<!-- AUTO-GENERATED:ENV-TABLE -->
### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `WP_SITE_URL` | Yes | WordPress サイトの URL | `https://your-site.example.com` |
| `WP_USERNAME` | Yes | WordPress ユーザー名 | `your_wordpress_username` |
| `WP_APP_PASSWORD` | Yes | WordPress アプリケーションパスワード | `your_application_password` |
| `WP_SEO_METHOD` | No | SEO フィールド設定方法 (`xmlrpc` / `none`) | `xmlrpc` |
| `WP_SEO_TITLE_KEY` | No | SEO タイトルのカスタムフィールドキー | `titleName` |
| `WP_SEO_DESC_KEY` | No | SEO ディスクリプションのカスタムフィールドキー | `description` |
<!-- /AUTO-GENERATED:ENV-TABLE -->

## Usage

### Claude Code Skills

```bash
# 記事生成（PR 作成 → マージ時に GitHub Actions で WP 自動投稿）
/generate [keyword]

# シリーズ記事生成（対話形式でシリーズ・記事を選択）
/series-generate

# 既存記事リライト
/revise [article-url]

# 既存記事の部分修正（対話形式）
/edit [article-url]

# 記事レビュー（品質チェック、指摘のみ）
/review [article.json path]

# ファクトチェック（WebSearch で事実検証、指摘のみ）
/fact-check [article.json path]

# 手動で収集した実体験データを記事に反映
/incorporate [session-dir]

# スクリーンショット撮影（Web / ターミナルモック）
/screenshot

# Claude Code UI モックアップのスクリーンショット
/cc-screenshot
```

各スキルは対話形式で必要な情報を質問します。`/generate` は PR 作成時に「ローカルのみ」を選択すると PR をスキップできます。

<!-- AUTO-GENERATED:SCRIPTS-TABLE -->
### npm Scripts

| Command | Description |
|---------|-------------|
| `npm run wp:fetch -- [count]` | WordPress から直近 N 件の記事を取得（default: 5） |
| `npm run wp:fetch-by-url -- <url>` | URL 指定で単一記事を取得 |
| `npm run wp:publish -- <path>` | article.json を WordPress に下書き投稿 |
| `npm run wp:update -- <postId> <path>` | article.json で既存記事を更新 |
| `npm run wp:upload-media -- <path> [alt]` | 画像を WP メディアライブラリにアップロード |
<!-- /AUTO-GENERATED:SCRIPTS-TABLE -->

## Architecture

```
.claude/skills/          Skills (user-invocable pipelines)
  generate/SKILL.md        Article generation (9 steps, PR-based review)
  series-generate/SKILL.md Series article generation (3 phases, delegates to /generate)
  revise/SKILL.md          Article rewriting (8 steps)
  edit/SKILL.md            Interactive editing (7 steps)
  review/SKILL.md          Quality review (3 steps)
  fact-check/SKILL.md      Fact verification (2 steps)
  incorporate/SKILL.md     Manual data incorporation (handson-tasks.json)
  screenshot/SKILL.md      Screenshot capture (Web + terminal mock)
  cc-screenshot/SKILL.md   Claude Code UI mockup screenshot

.claude/agents/          Agents (reusable, called by skills via Agent tool)
  style-loader.md          Style profile cache loading/analysis
  article-reviewer.md      5-category parallel review (haiku subagents)
  fact-checker.md          Claim extraction + parallel WebSearch verification

scripts/                 WordPress API scripts
  wp-fetch-posts.ts        Fetch recent posts
  wp-fetch-post-by-url.ts  Fetch single post by URL
  wp-publish-draft.ts      Publish draft (also used by GitHub Actions)
  wp-update-post.ts        Update existing post
  wp-upload-media.ts       Upload media to WP library
  wp-set-seo-fields.ts     Set SEO custom fields via XML-RPC

templates/               HTML templates for screenshot generation
  terminal-mockup.html     Terminal-style mockup
  claude-code-mockup.html  Claude Code UI mockup (14 components)

articles/                Reviewed articles (git-tracked, via PR)
  {slug}/                  Per-article directory
    article.json             WP publish data
    article.md               Review-friendly Markdown
    review.json              Auto-review results
    fact-check.json          Fact-check results
    screenshots/             Article screenshots

.github/workflows/       CI/CD
  wp-publish.yml           Auto-publish to WP on merge to main

output/                  Working files (gitignored)
  {sessionDir}/            Session-specific directory

cache/                   Cached data (gitignored)
  style-profiles/          Domain-specific style profiles (TTL: 30 days)

docs/series/             Series planning files
```

### Pipeline Flow

```
/generate (Steps 0-8)
  → style-loader → keyword/SEO analysis → outline → article → screenshots
  → article-reviewer (5x parallel haiku) → fact-checker (Nx parallel WebSearch)
  → Step 9: PR creation (article/{slug} branch)

Human Review (on PR)
  → Team reviews article.md, completes manual tasks
  → Approve

Merge to main → GitHub Actions → WP auto-publish
```

## Tech Stack

- TypeScript 5.7 (ES2022, ESNext modules)
- tsx (script execution, no build step)
- dotenv (environment variable management)
- WordPress REST API + Basic Auth (Application Password)
- GitHub Actions (auto-publish on PR merge)
