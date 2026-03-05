# article-pipeline

WordPress ブログの記事生成パイプライン。Claude Code のスキルで SEO 最適化された日本語記事を生成・リライト・編集し、WordPress に投稿する。

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
<!-- /AUTO-GENERATED:ENV-TABLE -->

## Usage

### Claude Code Skills

```bash
# 記事生成（WordPress に下書き投稿）
/generate <keyword>

# 記事生成（ローカル保存のみ）
/generate <keyword> --local

# 記事生成（文体キャッシュを再分析）
/generate <keyword> --refresh-style

# 既存記事リライト
/revise <article-url>

# 既存記事の部分修正（対話形式）
/edit <article-url>

# 記事レビュー（品質チェック）
/review [article.json path]

# ファクトチェック（WebSearch で事実検証）
/fact-check [article.json path]
```

`--local` フラグで WordPress 投稿/更新をスキップしてローカル保存のみにできます。

<!-- AUTO-GENERATED:SCRIPTS-TABLE -->
### npm Scripts

| Command | Description |
|---------|-------------|
| `npm run wp:fetch -- [count]` | WordPress から直近 N 件の記事を取得（default: 5） |
| `npm run wp:fetch-by-url -- <url>` | URL 指定で単一記事を取得 |
| `npm run wp:publish -- <path>` | article.json を WordPress に下書き投稿 |
| `npm run wp:update -- <postId> <path>` | article.json で既存記事を更新 |
<!-- /AUTO-GENERATED:SCRIPTS-TABLE -->

## Architecture

```
.claude/skills/          Skills (user-invocable pipelines)
  generate/SKILL.md        Article generation (9 steps)
  revise/SKILL.md          Article rewriting (8 steps)
  edit/SKILL.md            Interactive editing (7 steps)
  review/SKILL.md          Quality review (3 steps)
  fact-check/SKILL.md      Fact verification (2 steps)

.claude/agents/          Agents (reusable, called by skills via Agent tool)
  style-loader.md          Style profile cache loading/analysis
  article-reviewer.md      5-category parallel review (haiku subagents)
  fact-checker.md          Claim extraction + parallel WebSearch verification

scripts/                 WordPress API scripts
  wp-fetch-posts.ts        Fetch recent posts
  wp-fetch-post-by-url.ts  Fetch single post by URL
  wp-publish-draft.ts      Publish draft
  wp-update-post.ts        Update existing post

output/                  Generated files (gitignored)
  {sessionDir}/            Session-specific directory
    article.json             Generated article
    review.json              Review results
    fact-check.json          Fact-check results

cache/                   Cached data (gitignored)
  style-profiles/          Domain-specific style profiles (TTL: 30 days)
```

### Pipeline Flow

Skills orchestrate the pipeline; agents handle shared logic:

```
Skill ──→ style-loader agent ──→ [core steps] ──→ article-reviewer agent ──→ fact-checker agent
                                                         ↓                         ↓
                                                   5x haiku subagents        Nx haiku subagents
                                                   (parallel review)         (parallel WebSearch)
```

## Tech Stack

- TypeScript 5.7 (ES2022, ESNext modules)
- tsx (script execution, no build step)
- dotenv (environment variable management)
- WordPress REST API + Basic Auth (Application Password)
