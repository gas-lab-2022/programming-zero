# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordPress ブログの記事生成パイプライン。`.env` の `WP_SITE_URL` で指定されたサイトに対し、Claude Code のスキル（`/generate`）で SEO 最適化された日本語記事を 9 ステップで生成し、WordPress に下書き投稿する。

## Skills & Commands

```bash
# 記事生成（対話形式: キーワード・WP投稿・文体再分析を質問）
/generate

# 既存記事リライト（対話形式: URL・WP更新・文体再分析を質問）
/revise

# 既存記事の部分修正（対話形式: URL・WP更新を質問）
/edit

# 記事レビュー（品質チェック、指摘のみ）
/review [article.json パス]    # デフォルト: output/article.json

# ファクトチェック（WebSearchで事実検証、指摘のみ）
/fact-check [article.json パス]  # デフォルト: output/article.json

# シリーズ記事生成（対話形式: シリーズ・記事を選択して生成）
/series-generate

# スクリーンショット撮影（対話形式: モード・URL/説明を質問）
/screenshot

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
.claude/skills/generate/SKILL.md    ← 記事生成パイプライン定義（9ステップ、汎用）
.claude/skills/series-generate/SKILL.md ← シリーズ記事生成（/generate のラッパー、programming-zero固有）
.claude/skills/revise/SKILL.md      ← 既存記事リライトパイプライン定義（8ステップ）
.claude/skills/review/SKILL.md      ← 記事レビューパイプライン定義（3ステップ）
.claude/skills/fact-check/SKILL.md  ← ファクトチェックパイプライン定義（2ステップ）
.claude/skills/edit/SKILL.md        ← 記事修正パイプライン定義（7ステップ）
.claude/skills/screenshot/SKILL.md  ← スクリーンショット撮影（Web + ターミナルモック）
templates/terminal-mockup.html      ← ターミナル風HTMLテンプレート
docs/plans/claude-code-series.json  ← シリーズ記事管理ファイル（16記事）
.claude/agents/style-loader.md      ← 共通エージェント: 文体キャッシュ読込/分析
.claude/agents/article-reviewer.md  ← 共通エージェント: 5カテゴリ並列レビュー
.claude/agents/fact-checker.md      ← 共通エージェント: 主張抽出+並列WebSearch検証
scripts/wp-fetch-posts.ts           ← WP REST API: 既存記事取得（複数）
scripts/wp-fetch-post-by-url.ts     ← WP REST API: URL指定で単一記事取得
scripts/wp-publish-draft.ts         ← WP REST API: 下書き投稿（+ SEOフィールド自動設定）
scripts/wp-update-post.ts           ← WP REST API: 既存記事更新（+ SEOフィールド自動設定）
scripts/wp-set-seo-fields.ts        ← XML-RPC: テーマSEOフィールド設定（THE THOR対応）
docs/wp-theme-the-thor.md           ← THE THORテーマ固有の設定・API対応ガイド
output/{sessionDir}/article.json     ← 生成された記事データ（gitignore対象）
output/{sessionDir}/review.json     ← レビュー結果（gitignore対象）
output/{sessionDir}/fact-check.json ← ファクトチェック結果（gitignore対象）
cache/style-profiles/{domain}.json  ← 文体分析キャッシュ（gitignore対象）
```

### セッションディレクトリ（`output/{sessionDir}/`）

各パイプライン実行時にセッション固有のディレクトリを `output/` 配下に作成し、全出力ファイルをそこに書き出します。複数セッションの同時実行でファイルが競合しません。

- `/generate`: `output/YYYYMMDD-HHMMSS-<keyword>/`
- `/revise`: `output/YYYYMMDD-HHMMSS-revise-<slug>/`
- `/edit`: `output/YYYYMMDD-HHMMSS-edit-<slug>/`
- `/review`, `/fact-check`: 入力ファイルと同じディレクトリに出力

### 共通エージェント（`.claude/agents/`）

スキル間で共通の処理を再利用可能なエージェントとして抽出。スキルから Agent ツールで呼び出される:

- **style-loader**: 文体キャッシュの読込/分析/保存。入力: `refreshStyle` フラグ。出力: `styleProfile` JSON
- **article-reviewer**: 5カテゴリ（SEO・構成・可読性・文体一貫性・正確性）の並列 haiku サブエージェントでレビュー。入力: `outputPath`, `styleProfile`, `article`。出力: review.json + overallScore
- **fact-checker**: 事実主張抽出 + 並列 haiku サブエージェントで WebSearch 検証。入力: `outputPath`, `article`。出力: fact-check.json + overallVerdict

### 記事生成パイプライン（`/generate`）

Step 0〜9 が順番に実行され、各ステップの出力が次のステップのコンテキストとなる:

0. **文体分析** → `styleProfile`（style-loader エージェントに委任）
1. **キーワード分析** → `keywordAnalysis`（表層意図・潜在意図・最終ゴール）
2. **SEO分析** → `seoAnalysis`（WebSearch で上位記事を調査）
3. **意図深掘り** → `intentDeepDive`（読者の不安・障壁・望む結果）
4. **差別化設計** → `differentiation`（上位記事を超えるポイント）
5. **アウトライン** → `outline`（タイトル・メタ・セクション構成）
6. **本文生成** → `{sessionDir}/article.json`（HTML 形式の記事本文）
7. **記事レビュー** → `{sessionDir}/review.json`（article-reviewer エージェントに委任）
8. **ファクトチェック** → `{sessionDir}/fact-check.json`（fact-checker エージェントに委任）
9. **WP投稿**（`--local` 指定時はスキップ）

### 既存記事リライトパイプライン（`/revise`）

Step 0〜8 が順番に実行され、各ステップの出力が次のステップのコンテキストとなる:

0. **文体ロード** → `styleProfile`（style-loader エージェントに委任）
1. **既存記事取得** → `originalArticle`（URL→スラッグ→WP API）
2. **記事診断** → `diagnosis`（SEO・構成・可読性・情報鮮度の問題点）
3. **SEO再調査** → `seoAnalysis`（WebSearch で現在の上位記事を調査）
4. **リライト方針** → `revisionPlan`（何を残し何を変えるか）
5. **本文リライト** → `{sessionDir}/article.json`（HTML 形式のリライト記事）
6. **記事レビュー** → `{sessionDir}/review.json`（article-reviewer エージェントに委任）
7. **ファクトチェック** → `{sessionDir}/fact-check.json`（fact-checker エージェントに委任）
8. **WP更新**（`--local` 指定時はスキップ）

### 記事レビューパイプライン（`/review`）

Step 0〜2 が順番に実行される:

0. **文体ロード** → `styleProfile`（style-loader エージェントに委任）
1. **記事読み込み** → `article`（article.json を読み込み）
2. **多角的レビュー** → `{outputDir}/review.json`（article-reviewer エージェントに委任）

### ファクトチェックパイプライン（`/fact-check`）

Step 0〜1 が順番に実行される:

0. **記事読み込み** → `article`（article.json を読み込み）
1. **ファクトチェック** → `{outputDir}/fact-check.json`（fact-checker エージェントに委任）

### 記事修正パイプライン（`/edit`）

Step 0〜6 が実行される（Step 3 は修正完了までループ）:

0. **文体ロード** → `styleProfile`（style-loader エージェントに委任）
1. **既存記事取得** → `originalArticle`（URL→スラッグ→WP API）
2. **記事構造表示** → タイトル・見出し構造・文字数を表示
3. **修正ループ** → ユーザー指示に基づく部分修正（指示→反映→差分表示→繰り返し）
4. **記事書き出し** → `{sessionDir}/article.json`
5. **記事レビュー** → `{sessionDir}/review.json`（article-reviewer エージェントに委任）
6. **最終確認 & WP更新**（ユーザー承認後。`--local` 指定時はスキップ）

### article.json フォーマット

```json
{
  "title": "記事タイトル",
  "seoTitle": "SEOタイトル（titleタグ用。省略時はtitleを使用）",
  "slug": "english-hyphenated-slug",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2"]
}
```

- `seoTitle`: SEOタイトル（`<title>` タグ用）。投稿タイトルとは別にSEO用に最適化可能。省略時はテーマが自動生成。
- `slug`: パーマリンク。`/generate` では既存記事のスラッグパターンを WP API で取得・分析して同じスタイルで新規生成。`/revise` `/edit` では既存スラッグを維持。

### 文体キャッシュ（`cache/style-profiles/`）

- Step 0 の文体分析結果をドメインごとにキャッシュ（例: `cache/style-profiles/your-domain.json`）
- 2回目以降の `/generate` 実行時は記事取得・分析をスキップしてキャッシュを再利用
- **TTL 30日**: 30日経過で自動的に再分析（キャッシュ使用時に経過日数を表示）
- `--refresh-style` フラグでキャッシュを手動で無視して再分析も可能

## WordPress API

- REST API + Basic Auth（Application Password）で投稿・更新
- SEOフィールドは `.env` の `WP_SEO_METHOD` / `WP_SEO_TITLE_KEY` / `WP_SEO_DESC_KEY` で設定（未設定ならスキップ）
- テーマ固有の設定例: [docs/wp-theme-the-thor.md](docs/wp-theme-the-thor.md)
- 認証情報は `.env` に格納（`WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`）

## Tech Stack

- TypeScript 5.7（ES2022, ESNext modules）
- tsx でスクリプト実行（ビルド不要）
- dotenv で環境変数管理
