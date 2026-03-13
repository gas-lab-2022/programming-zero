# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WordPress ブログの記事生成パイプライン。`.env` の `WP_SITE_URL` で指定されたサイトに対し、Claude Code のスキル（`/generate`）で SEO 最適化された日本語記事を 9 ステップで生成し、PR ベースの人間レビューを経て GitHub Actions で WordPress に自動投稿する。

**設計原則**: このリポジトリは特定サイト・テーマに依存しない汎用パイプラインとして設計する。サイト固有の設定は `.env` や `docs/series/` に分離し、スキル・スクリプトのコードにハードコードしない。

## Skills & Commands

```bash
# 記事生成（対話形式: キーワード・PR作成を質問）
# PR マージ時に GitHub Actions で WP に自動投稿
/generate

# マニュアル記事生成（対話形式: ソースファイル・関連記事・PR作成を質問）
# README等のソースドキュメントからツール利用マニュアル・設定ガイドを生成
/generate-manual

# 既存記事リライト（対話形式: URL・WP更新を質問）
/revise

# 既存記事の部分修正（対話形式: URL・WP更新を質問）
/edit

# 記事レビュー（品質チェック、指摘のみ）
/review [article.json パス]    # デフォルト: output/article.json

# ファクトチェック（WebSearchで事実検証、指摘のみ）
/fact-check [article.json パス]  # デフォルト: output/article.json

# シリーズ記事生成（対話形式: シリーズ・記事を選択して生成）
/series-generate

# シリーズ進捗ステータス表示
/series-status

# 手動で収集した実体験データを記事に反映
/incorporate [セッションディレクトリ]

# 図解画像生成（Gemini CLI + Nanobanana で概念図・フロー図・ステップ図を生成）
/illustrate [説明テキスト]

# スクリーンショット撮影（対話形式: モード・URL/説明を質問）
/screenshot

# WordPress から直近N件の記事を取得
npm run wp:fetch -- [count]    # default: 5

# URL指定で単一記事を取得
npm run wp:fetch-by-url -- <記事URL>

# article.json を WordPress に下書き投稿
npm run wp:publish -- output/article.json

# article.json で既存記事を更新（--status=publish でステータス変更可）
npm run wp:update -- <postId> output/article.json [--status=publish]

# 画像をWPメディアライブラリにアップロード
npm run wp:upload-media -- <image-path> [alt-text]

# TypeScript 型チェック
npx tsc --noEmit
```

## Architecture

```
.claude/skills/generate/SKILL.md    ← 記事生成パイプライン定義（9ステップ、汎用）
.claude/skills/generate-manual/SKILL.md ← マニュアル記事生成（6ステップ、ソースドキュメントベース、吹き出しなし）
.claude/skills/series-generate/SKILL.md ← シリーズ記事生成（3フェーズ: 前処理→/generate委任→後処理、docs/series/{domain}/*/series.md を使用）
.claude/skills/series-status/SKILL.md  ← シリーズ進捗ステータス表示
.claude/skills/revise/SKILL.md      ← 既存記事リライトパイプライン定義（8ステップ）
.claude/skills/review/SKILL.md      ← 記事レビューパイプライン定義（3ステップ）
.claude/skills/fact-check/SKILL.md  ← ファクトチェックパイプライン定義（2ステップ）
.claude/skills/edit/SKILL.md        ← 記事修正パイプライン定義（7ステップ）
.claude/skills/incorporate/SKILL.md  ← 手動実体験データの記事反映（handson-tasks.json 処理）
.claude/skills/illustrate/SKILL.md  ← 図解画像生成（Gemini CLI + Nanobanana、フロー図・ステップ図・概念図）
.claude/skills/screenshot/SKILL.md  ← スクリーンショット撮影（Web + ターミナルモック）
templates/terminal-mockup.html      ← ターミナル風HTMLテンプレート
docs/series/{domain}/{slug}/series.md ← シリーズ記事管理ファイル（Markdown + YAML frontmatter）
docs/series/{domain}/{slug}/design.md ← シリーズ設計ドキュメント（任意）
.claude/agents/style-loader.md      ← 共通エージェント: 文体キャッシュ読込/分析
.claude/agents/article-reviewer.md  ← 共通エージェント: 5カテゴリ並列レビュー
.claude/agents/fact-checker.md      ← 共通エージェント: 主張抽出+並列WebSearch検証
scripts/wp-fetch-posts.ts           ← WP REST API: 既存記事取得（複数）
scripts/wp-fetch-post-by-url.ts     ← WP REST API: URL指定で単一記事取得
scripts/wp-publish-draft.ts         ← WP REST API: 下書き投稿（+ SEOフィールド自動設定）
scripts/wp-update-post.ts           ← WP REST API: 既存記事更新（+ SEOフィールド自動設定）
scripts/wp-upload-media.ts           ← WP REST API: メディアアップロード（スクリーンショット等）
scripts/wp-set-seo-fields.ts        ← SEOフィールド設定（.env のキー設定に基づく汎用実装）
docs/wp-theme-the-thor.md           ← THE THORテーマ固有の .env 設定例
articles/{domain}/{slug}/             ← レビュー済み記事（PR経由で git 管理）
.github/workflows/wp-publish.yml    ← GitHub Actions: PRマージ時のWP自動投稿（wpPostId があれば既存下書きを公開、なければ新規投稿）
output/{domain}/{sessionDir}/article.json     ← 生成された記事データ（gitignore対象）
output/{domain}/{sessionDir}/review.md     ← レビュー結果（gitignore対象）
output/{domain}/{sessionDir}/fact-check.md ← ファクトチェック結果（gitignore対象）
output/{domain}/{sessionDir}/handson-tasks.json ← 手動実体験タスク一覧・機械読取用（gitignore対象）
output/{domain}/{sessionDir}/handson-tasks.md  ← 手動実体験タスク一覧・ユーザー向け（gitignore対象）
cache/style-profiles/{domain}/profile.md  ← 文体分析キャッシュ（gitignore対象）
```

### ドメイン別ディレクトリ構成

すべての生成物は `.env` の `WP_SITE_URL` から取得したドメイン（例: `programming-zero.net`）で区切って管理する。これにより、複数サイトの記事を同一リポジトリで管理できる。

```
articles/{domain}/{slug}/           ← PR管理記事
output/{domain}/{sessionDir}/       ← セッション出力（gitignore対象）
docs/series/{domain}/{slug}/        ← シリーズ管理
cache/style-profiles/{domain}/      ← 文体キャッシュ（gitignore対象）
```

### セッションディレクトリ（`output/{domain}/{sessionDir}/`）

各パイプライン実行時にセッション固有のディレクトリを `output/{domain}/` 配下に作成し、全出力ファイルをそこに書き出します。複数セッションの同時実行でファイルが競合しません。

- `/generate`: `output/{domain}/YYYYMMDD-HHMMSS-<keyword>/`
- `/revise`: `output/{domain}/YYYYMMDD-HHMMSS-revise-<slug>/`
- `/edit`: `output/{domain}/YYYYMMDD-HHMMSS-edit-<slug>/`
- `/review`, `/fact-check`: 入力ファイルと同じディレクトリに出力

### 共通エージェント（`.claude/agents/`）

スキル間で共通の処理を再利用可能なエージェントとして抽出。スキルから Agent ツールで呼び出される:

- **style-loader**: 文体キャッシュの読込/分析/保存。キャッシュがあればユーザーに再分析するか質問。出力: `styleProfile` JSON
- **article-reviewer**: 5カテゴリ（SEO・構成・可読性・文体一貫性・正確性）の並列 haiku サブエージェントでレビュー。入力: `outputPath`, `styleProfile`, `article`。出力: review.md + overallScore
- **fact-checker**: 事実主張抽出 + 並列 haiku サブエージェントで WebSearch 検証。入力: `outputPath`, `article`。出力: fact-check.md + overallVerdict

### 記事生成パイプライン（`/generate`）

Step 0〜9 が順番に実行され、各ステップの出力が次のステップのコンテキストとなる:

0. **文体分析** → `styleProfile`（style-loader エージェントに委任）
1. **キーワード分析** → `keywordAnalysis`（表層意図・潜在意図・最終ゴール）
2. **SEO分析** → `seoAnalysis`（一次情報収集 → 実体験検証候補の洗い出し → 競合記事調査）
3. **意図深掘り** → `intentDeepDive`（読者の不安・障壁・望む結果）
4. **差別化設計** → `differentiation`（上位記事を超えるポイント）
5. **アウトライン** → `outline`（タイトル・メタ・セクション構成・`illustrationCandidates`・`screenshotCandidates`）
6. **本文生成** → `{sessionDir}/article.json`（HTML 形式の記事本文）
6.5. **図解 & スクリーンショット生成** → Gemini CLI + Nanobanana で図解画像生成（`illustrationCandidates`）→ Playwright でスクリーンショット撮影（`screenshotCandidates`）→ WP メディアアップロード → 記事 HTML に `<figure>` 挿入（両方空なら スキップ）
7. **記事レビュー** → `{sessionDir}/review.md`（article-reviewer エージェントに委任）
8. **ファクトチェック** → `{sessionDir}/fact-check.md`（fact-checker エージェントに委任）
9. **PR作成** → WP 下書き投稿（プレビュー用）→ ブランチ作成 → `articles/{domain}/{slug}/` にファイル配置 → PR 作成（対話で「いいえ」選択時はスキップ。PR に WP プレビュー URL を記載。マージ時に GitHub Actions で下書きを公開に更新）

### マニュアル記事生成パイプライン（`/generate-manual`）

Step 0〜6 が順番に実行される。`/generate` との違い: SEO分析・差別化設計をスキップし、ソースドキュメント（README等）の翻訳・整形に特化。吹き出し不使用:

0. **文体分析** → `styleProfile`（style-loader エージェントに委任）
1. **ソース分析** → `sourceAnalysis`（ソースドキュメントから機能・手順・制約・注意点を抽出）
2. **アウトライン** → `outline`（固定構成: 概要→STEP手順→データ一覧→注意点→Q&A）
3. **本文生成** → `{sessionDir}/article.json`（HTML 形式、リスト中心、吹き出しなし）
3.5. **スクリーンショット生成** → Playwright でスクリーンショット撮影 → WP メディアアップロード → 記事 HTML に `<figure>` 挿入（空ならスキップ）
4. **記事レビュー** → `{sessionDir}/review.md`（article-reviewer エージェントに委任）
5. **ファクトチェック** → `{sessionDir}/fact-check.md`（fact-checker エージェントに委任）
6. **PR作成** → WP 下書き投稿 → ブランチ作成 → `articles/{domain}/{slug}/` にファイル配置 → PR 作成（対話で「いいえ」選択時はスキップ）

### 既存記事リライトパイプライン（`/revise`）

Step 0〜8 が順番に実行され、各ステップの出力が次のステップのコンテキストとなる:

0. **文体ロード** → `styleProfile`（style-loader エージェントに委任）
1. **既存記事取得** → `originalArticle`（URL→スラッグ→WP API）
2. **記事診断** → `diagnosis`（SEO・構成・可読性・情報鮮度の問題点）
3. **SEO再調査** → `seoAnalysis`（WebSearch で現在の上位記事を調査）
4. **リライト方針** → `revisionPlan`（何を残し何を変えるか）
5. **本文リライト** → `{sessionDir}/article.json`（HTML 形式のリライト記事）
6. **記事レビュー** → `{sessionDir}/review.md`（article-reviewer エージェントに委任）
7. **ファクトチェック** → `{sessionDir}/fact-check.md`（fact-checker エージェントに委任）
8. **WP更新**（対話で「いいえ」選択時はスキップ）

### 記事レビューパイプライン（`/review`）

Step 0〜2 が順番に実行される:

0. **文体ロード** → `styleProfile`（style-loader エージェントに委任）
1. **記事読み込み** → `article`（article.json を読み込み）
2. **多角的レビュー** → `{outputDir}/review.md`（article-reviewer エージェントに委任）

### ファクトチェックパイプライン（`/fact-check`）

Step 0〜1 が順番に実行される:

0. **記事読み込み** → `article`（article.json を読み込み）
1. **ファクトチェック** → `{outputDir}/fact-check.md`（fact-checker エージェントに委任）

### 記事修正パイプライン（`/edit`）

Step 0〜6 が実行される（Step 3 は修正完了までループ）:

0. **文体ロード** → `styleProfile`（style-loader エージェントに委任）
1. **既存記事取得** → `originalArticle`（URL→スラッグ→WP API）
2. **記事構造表示** → タイトル・見出し構造・文字数を表示
3. **修正ループ** → ユーザー指示に基づく部分修正（指示→反映→差分表示→繰り返し）
4. **記事書き出し** → `{sessionDir}/article.json`
5. **記事レビュー** → `{sessionDir}/review.md`（article-reviewer エージェントに委任）
6. **最終確認 & WP更新**（ユーザー承認後。対話で「いいえ」選択時はスキップ）

### 実体験データ反映パイプライン（`/incorporate`）

Step 0〜3 が実行される:

0. **入力確認** → セッションディレクトリの特定、handson-tasks.json 読み込み
1. **タスク一覧表示** → 未処理タスクをユーザーに提示
2. **タスク処理ループ** → タスクタイプ別に処理（screenshot / cc-screenshot / terminal-output / text）
3. **記事保存 & WP更新**（対話で「いいえ」選択時はスキップ）

### 図解画像生成パイプライン（`/illustrate`）

Gemini CLI + Nanobanana で記事用の図解画像を生成。内容に応じて最適な図解タイプを自動選択:

- **フロー図・構造図** → フロー・分岐・アーキテクチャなどの構造を可視化
- **ステップ図・時系列** → 手順・プロセス・変遷を連続画像で表現
- **概念図・比較図** → 抽象概念・対比を直感的なイラストで表現

スタンドアロンで使用するほか、`/generate` パイプラインの Step 6.5 からも `illustrationCandidates` 経由で自動的に呼び出される。

### スクリーンショットパイプライン（`/screenshot`）

対話で入力確認後、モード別に分岐:

- **Mode A: Web撮影** → URL指定 → Playwright で撮影 → WP メディアアップロード
- **Mode B: ターミナルモック撮影** → コマンド/出力指定 → HTML テンプレート生成 → Playwright で撮影 → WP メディアアップロード

### シリーズ記事生成パイプライン（`/series-generate`）

3フェーズで実行（Phase 2 は `/generate` に委任）:

- **Phase 1: シリーズ前処理** → シリーズ選択 → 設計ドキュメント読込 → 対象記事選択 → 既存公開記事URL取得 → seriesContext 構築 → ユーザー確認
- **Phase 2: /generate パイプライン実行**（seriesContext を渡して委任）
- **Phase 3: シリーズ後処理** → SEOフィールド設定 → シリーズ計画更新 → 内部リンク追加提案 → 次の記事表示

### article.json フォーマット

```json
{
  "title": "記事タイトル",
  "seoTitle": "SEOタイトル（titleタグ用。省略時はtitleを使用）",
  "slug": "english-hyphenated-slug",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2"],
  "wpPostId": 12345
}
```

- `seoTitle`: SEOタイトル（`<title>` タグ用）。投稿タイトルとは別にSEO用に最適化可能。省略時はテーマが自動生成。
- `slug`: パーマリンク。`/generate` では既存記事のスラッグパターンを WP API で取得・分析して同じスタイルで新規生成。`/revise` `/edit` では既存スラッグを維持。
- `wpPostId`: WP の Post ID。`/generate` の Step 9 で下書き投稿時に設定。PR マージ時に GitHub Actions がこの ID を使って既存下書きを公開に更新。

### 文体キャッシュ（`cache/style-profiles/{domain}/`）

- Step 0 の文体分析結果をドメインごとにキャッシュ（例: `cache/style-profiles/your-domain.example.com/profile.md`）
- Markdown 形式（YAML frontmatter + セクション別記述）で人間にも読みやすい
- 2回目以降の `/generate` 実行時は記事取得・分析をスキップしてキャッシュを再利用
- キャッシュがある場合、エージェントがユーザーに再分析するか質問

## WordPress API

- REST API + Basic Auth（Application Password）で投稿・更新
- SEOフィールドは `.env` の `WP_SEO_METHOD`（`xmlrpc` | `none`）/ `WP_SEO_TITLE_KEY` / `WP_SEO_DESC_KEY` で設定（未設定ならスキップ）
- テーマ固有の設定例: [docs/wp-theme-the-thor.md](docs/wp-theme-the-thor.md)
- 認証情報は `.env` に格納（`WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`）

## Tech Stack

- TypeScript 5.7（ES2022, ESNext modules）
- tsx でスクリプト実行（ビルド不要）
- dotenv で環境変数管理
