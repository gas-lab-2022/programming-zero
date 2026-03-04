# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordPress ブログ「programming-zero.net」の記事生成パイプライン。Claude Code のスキル（`/generate`）で SEO 最適化された日本語記事を 9 ステップで生成し、WordPress に下書き投稿する。

## Skills & Commands

```bash
# 記事生成（WordPress に下書き投稿）
/generate <キーワード>

# 記事生成（ローカル保存のみ、WP投稿スキップ）
/generate <キーワード> --local

# 記事生成（文体キャッシュを無視して再分析）
/generate <キーワード> --refresh-style

# 既存記事リライト（WordPress 上の記事を更新）
/revise <記事URL>

# 既存記事リライト（ローカル保存のみ、WP更新スキップ）
/revise <記事URL> --local

# 既存記事の部分修正（対話形式でユーザー指示を正確に反映）
/edit <記事URL>

# 既存記事の部分修正（ローカル保存のみ、WP更新スキップ）
/edit <記事URL> --local

# 記事レビュー（品質チェック、指摘のみ）
/review [article.json パス]    # デフォルト: output/article.json

# ファクトチェック（WebSearchで事実検証、指摘のみ）
/fact-check [article.json パス]  # デフォルト: output/article.json

# WordPress から直近N件の記事を取得
npm run wp:fetch -- [count]    # default: 5

# URL指定で単一記事を取得
npm run wp:fetch-by-url -- <記事URL>

# article.json を WordPress に下書き投稿
npm run wp:publish -- output/article.json

# article.json で既存記事を更新
npm run wp:update -- <postId> output/article.json

# TypeScript 型チェック
npx tsc --noEmit
```

## Architecture

```
.claude/skills/generate/SKILL.md    ← 記事生成パイプライン定義（9ステップ）
.claude/skills/revise/SKILL.md      ← 既存記事リライトパイプライン定義（8ステップ）
.claude/skills/review/SKILL.md      ← 記事レビューパイプライン定義（3ステップ）
.claude/skills/fact-check/SKILL.md  ← ファクトチェックパイプライン定義（3ステップ）
.claude/skills/edit/SKILL.md        ← 記事修正パイプライン定義（7ステップ）
scripts/wp-fetch-posts.ts           ← WP REST API: 既存記事取得（複数）
scripts/wp-fetch-post-by-url.ts     ← WP REST API: URL指定で単一記事取得
scripts/wp-publish-draft.ts         ← WP REST API: 下書き投稿
scripts/wp-update-post.ts           ← WP REST API: 既存記事更新
output/article.json                 ← 生成された記事データ（gitignore対象）
output/review.json                  ← レビュー結果（gitignore対象）
output/fact-check.json              ← ファクトチェック結果（gitignore対象）
cache/style-profiles/{domain}.json  ← 文体分析キャッシュ（gitignore対象）
```

### 記事生成パイプライン（`/generate`）

Step 0〜9 が順番に実行され、各ステップの出力が次のステップのコンテキストとなる:

0. **文体分析** → `styleProfile`（キャッシュ or 既存記事の語尾・トーン・見出しパターン）
1. **キーワード分析** → `keywordAnalysis`（表層意図・潜在意図・最終ゴール）
2. **SEO分析** → `seoAnalysis`（WebSearch で上位記事を調査）
3. **意図深掘り** → `intentDeepDive`（読者の不安・障壁・望む結果）
4. **差別化設計** → `differentiation`（上位記事を超えるポイント）
5. **アウトライン** → `outline`（タイトル・メタ・セクション構成）
6. **本文生成** → `output/article.json`（HTML 形式の記事本文）
7. **記事レビュー** → `output/review.json`（5カテゴリの品質チェック）
8. **ファクトチェック** → `output/fact-check.json`（WebSearch による事実検証）
9. **WP投稿**（`--local` 指定時はスキップ）

### 既存記事リライトパイプライン（`/revise`）

Step 0〜8 が順番に実行され、各ステップの出力が次のステップのコンテキストとなる:

0. **文体ロード** → `styleProfile`（キャッシュから。generate と同じロジック）
1. **既存記事取得** → `originalArticle`（URL→スラッグ→WP API）
2. **記事診断** → `diagnosis`（SEO・構成・可読性・情報鮮度の問題点）
3. **SEO再調査** → `seoAnalysis`（WebSearch で現在の上位記事を調査）
4. **リライト方針** → `revisionPlan`（何を残し何を変えるか）
5. **本文リライト** → `output/article.json`（HTML 形式のリライト記事）
6. **記事レビュー** → `output/review.json`（5カテゴリの品質チェック）
7. **ファクトチェック** → `output/fact-check.json`（WebSearch による事実検証）
8. **WP更新**（`--local` 指定時はスキップ）

### 記事レビューパイプライン（`/review`）

Step 0〜2 が順番に実行される:

0. **文体ロード** → `styleProfile`（キャッシュから。generate と同じロジック）
1. **記事読み込み** → `article`（article.json を読み込み）
2. **多角的レビュー** → `output/review.json`（SEO・構成・可読性・文体一貫性・正確性の5カテゴリ）

### ファクトチェックパイプライン（`/fact-check`）

Step 0〜2 が順番に実行される:

0. **記事読み込み** → `article`（article.json を読み込み）
1. **主張抽出** → `claims`（数値・手順・因果関係・固有名詞の属性を抽出）
2. **WebSearch 検証** → `output/fact-check.json`（各主張の verdict + 総合評価）

### 記事修正パイプライン（`/edit`）

Step 0〜6 が実行される（Step 3 は修正完了までループ）:

0. **文体ロード** → `styleProfile`（キャッシュから。generate と同じロジック）
1. **既存記事取得** → `originalArticle`（URL→スラッグ→WP API）
2. **記事構造表示** → タイトル・見出し構造・文字数を表示
3. **修正ループ** → ユーザー指示に基づく部分修正（指示→反映→差分表示→繰り返し）
4. **記事書き出し** → `output/article.json`
5. **記事レビュー** → `output/review.json`（5カテゴリの並列サブエージェント）
6. **最終確認 & WP更新**（ユーザー承認後。`--local` 指定時はスキップ）

### article.json フォーマット

```json
{
  "title": "記事タイトル",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2"]
}
```

### 文体キャッシュ（`cache/style-profiles/`）

- Step 0 の文体分析結果をドメインごとにキャッシュ（例: `cache/style-profiles/programming-zero.net.json`）
- 2回目以降の `/generate` 実行時は記事取得・分析をスキップしてキャッシュを再利用
- **TTL 30日**: 30日経過で自動的に再分析（キャッシュ使用時に経過日数を表示）
- `--refresh-style` フラグでキャッシュを手動で無視して再分析も可能

## WordPress API

- REST API + Basic Auth（Application Password）
- 認証情報は `.env` に格納（`WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`）

## Tech Stack

- TypeScript 5.7（ES2022, ESNext modules）
- tsx でスクリプト実行（ビルド不要）
- dotenv で環境変数管理
