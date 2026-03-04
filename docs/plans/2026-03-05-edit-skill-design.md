# `/edit` スキル Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** WordPress 既存記事をユーザーの修正指示に基づいて対話的に部分修正するスキル `/edit` を新設する

**Architecture:** `.claude/skills/edit/SKILL.md` に7ステップのパイプラインを定義。Step 0-1 は `/revise` と同じパターン（文体ロード・記事取得）、Step 2 で記事構造を表示、Step 3 で対話ループ（AskUserQuestion で修正指示→反映→差分表示→繰り返し）、Step 4 で article.json 書き出し、Step 5 で並列サブエージェントレビュー（`/review` と同じパターン）、Step 6 でユーザー承認後に WP 更新。

**Tech Stack:** Claude Code Skills (Markdown), WordPress REST API (既存スクリプト再利用)

---

## Task 1: `.claude/skills/edit/SKILL.md` を作成

**Files:**
- Create: `.claude/skills/edit/SKILL.md`

**Step 1: スキルファイルを作成**

以下の内容で `.claude/skills/edit/SKILL.md` を作成する。

```markdown
---
name: edit
description: WordPress上の既存記事をユーザーの修正指示に基づいて対話的に部分修正するパイプライン。指示された箇所だけを正確に変更し、それ以外は一切変えない。
argument-hint: "<記事URL> [--local]"
disable-model-invocation: true
---

あなたは WordPress ブログ「programming-zero.net」の記事修正エージェントです。
以下の手順を実行し、ユーザーの修正指示に基づいて既存記事を正確に部分修正してください。

**重要なルール:**
- ユーザーが指示した箇所**だけ**を変更し、それ以外の部分は一切変えないでください
- `/revise` のような全面リライトではなく、外科的な部分修正に徹してください

---

## Step 0: 文体ロード（キャッシュ対応）

あなたは文体分析の専門家です。

このステップでは、既存記事の文体を分析して `styleProfile` を取得します。
分析結果はドメインごとにキャッシュされ、2回目以降は再利用されます。

### 手順

1. `.env` の `WP_SITE_URL` からドメインを取得してください（例: `https://programming-zero.net` → `programming-zero.net`）。以下の Bash コマンドで取得できます：

` ` `bash
grep WP_SITE_URL .env | sed 's|.*://||' | sed 's|/.*||'
` ` `

2. **キャッシュ確認**: `cache/style-profiles/{domain}.json` を Read ツールで読み込んでください。
   - **ファイルが存在しない場合（キャッシュミス）**: 手順 3 に進んでください。
   - **ファイルが存在する場合**: `cachedAt` の日時と現在日時を比較してください。
     - **30日以上経過** → 「⏰ 文体キャッシュが {経過日数}日前のため、自動で再分析します」と表示し、**手順 3** に進んでください。
     - **30日未満** → 「✅ 文体キャッシュを使用（{経過日数}日前に分析）」と表示し、JSON の `styleProfile` フィールドを `styleProfile` として保持して **Step 1 に進んでください**（記事取得・分析をスキップ）。

3. **キャッシュなし（新規分析）**:

   a. WordPress から直近5件の既存記事を取得します：

   ` ` `bash
   npx tsx scripts/wp-fetch-posts.ts 5
   ` ` `

   b. 取得した記事の文体・スタイルを以下の観点で分析してください：

   - **writingStyle**: 文体の全体的な特徴（説明的か会話的か、簡潔か詳細か、など）
   - **sentenceEndings**: よく使われる語尾パターン（3〜5個）
   - **tone**: 敬体/常体の判定と、トーンの特徴（親しみやすさ、専門性など）
   - **headingPattern**: H2/H3見出しの使い方パターン（命名規則、粒度など）
   - **sectionStructure**: セクション構成の傾向（導入→本題→まとめ、など）

   c. 分析結果を以下のフォーマットで `cache/style-profiles/{domain}.json` に Write ツールで書き出してください：

   ` ` `json
   {
     "domain": "{domain}",
     "cachedAt": "{ISO 8601形式の現在日時}",
     "styleProfile": {
       "writingStyle": "...",
       "sentenceEndings": ["...", "..."],
       "tone": "...",
       "headingPattern": "...",
       "sectionStructure": "..."
     }
   }
   ` ` `

   d. `styleProfile` を保持してください。

---

## Step 1: 既存記事取得

### 手順

`$ARGUMENTS` から記事 URL を抽出してください（`--local` などのフラグは除外）。

以下の Bash コマンドで既存記事を取得してください：

` ` `bash
npx tsx scripts/wp-fetch-post-by-url.ts <記事URL>
` ` `

取得結果を `originalArticle` として保持してください。以下のフィールドを含みます：
- **id**: 記事の Post ID（Step 6 で更新時に使用）
- **title**: 記事タイトル
- **content**: 記事本文（HTML）
- **slug**: URLスラッグ
- **link**: 記事URL

取得に失敗した場合は、エラーメッセージを表示して処理を中断してください。

---

## Step 2: 記事構造の表示

### タスク

ユーザーが修正箇所を特定しやすいように、記事の構造を見やすく表示してください。

### 表示内容

以下の情報をコンソールに表示してください：

1. **タイトル**: `originalArticle.title`
2. **URL**: `originalArticle.link`
3. **見出し構造**: `content` から H2/H3 タグを抽出し、インデント付きの一覧で表示
4. **総文字数**: HTML タグを除いた本文の文字数

### 表示例

` ` `
## 記事の構造

タイトル: 「プログラミング入門ガイド」
URL: https://programming-zero.net/programming-guide/

### 見出し構造
- H2: プログラミングとは？
  - H3: プログラミングの定義
  - H3: なぜプログラミングを学ぶのか
- H2: 初心者におすすめの言語
  - H3: Python
  - H3: JavaScript
- H2: 学習の始め方
- H2: まとめ

総文字数: 約 3,200 文字
` ` `

表示後、「修正指示をお聞かせください」とメッセージを表示して Step 3 に進んでください。

---

## Step 3: 修正ループ（対話）

### 概要

ユーザーの修正指示を受け取り、記事を部分修正するループです。ユーザーが「修正完了」を選択するまで繰り返します。

記事の現在の状態を `currentArticle` として保持してください（初回は `originalArticle` のコピー）。

### 3-1. 修正指示の受け取り

AskUserQuestion ツールで修正指示を受け取ってください：

- `question`: 「どの部分をどのように修正しますか？（具体的に指示してください）」
- `header`: 「修正指示」
- `options`:
  - 「修正完了 → レビューに進む」: 修正ループを終了し Step 4 に進む
  - 「記事構造を再表示」: Step 2 の構造表示を再度行い、3-1 に戻る

ユーザーが Other（自由記述）で修正指示を入力した場合は 3-2 に進んでください。
「修正完了 → レビューに進む」を選択した場合は Step 4 に進んでください。

### 3-2. 修正の実行

ユーザーの指示に基づいて `currentArticle` の `content` を修正してください。

**厳守ルール:**
1. **指示された箇所だけ** を変更し、他の部分は一切変えない
2. `styleProfile` の文体（語尾・トーン・見出しパターン）を厳守
3. HTML 構造を壊さないようにする（WordPress ブロックエディタ互換）
4. 新しいセクションを追加する場合も、既存部分は変更しない

### 3-3. 変更箇所の差分表示

修正後、変更した箇所を **Before / After** 形式でコンソールに表示してください：

` ` `
### 変更 1/N: {変更の概要}
Before: 「変更前のテキスト」
After:  「変更後のテキスト」
` ` `

- 追加の場合は Before なしで After のみ表示（「（新規追加）」と注記）
- 削除の場合は After なしで Before のみ表示（「（削除）」と注記）
- 変更箇所が長い場合は、変更部分の前後を含む適切な範囲で引用

### 3-4. 継続確認

差分を表示したら、3-1 に戻って次の修正指示を待ってください。

---

## Step 4: article.json 書き出し

### タスク

`currentArticle` を `output/article.json` に書き出してください。

### フォーマット

` ` `json
{
  "title": "記事タイトル（currentArticle.title）",
  "htmlContent": "記事本文HTML（currentArticle.content）",
  "metaDescription": "メタディスクリプション（既存記事から抽出、またはタイトルから生成）",
  "tags": []
}
` ` `

Write ツールで `output/article.json` に書き出してください。

---

## Step 5: 記事レビュー（並列サブエージェント）

### コンテキスト
- Step 0 の `styleProfile`
- Step 4 で書き出した `output/article.json`

### タスク

`output/article.json` を Read ツールで読み込み、5カテゴリのレビューを **並列サブエージェント** で実行してください。

#### 手順

1. `output/article.json` を Read ツールで読み込んで `article` として保持してください。

2. 以下の **5つの Agent ツール呼び出し** を **1つのレスポンスにまとめて並列実行** してください。各エージェントのパラメータ：
   - `subagent_type`: `general-purpose`
   - `model`: `haiku`
   - `run_in_background`: `true`

#### サブエージェント一覧

**エージェント 1: SEO レビュー**
- `description`: `レビュー: SEO`
- `prompt`:

` ` `
あなたは SEO レビューの専門家です。以下の記事を SEO の観点でレビューしてください。

記事タイトル: {article.title}
メタディスクリプション: {article.metaDescription}
本文: {article.htmlContent}
タグ: {article.tags}

評価基準:
- タイトル長（32文字以内推奨）
- メタディスクリプション（120文字以内）
- 見出し構造（H2/H3 の階層が適切か）
- キーワードの自然な配置

結果を以下の JSON のみで返してください（他のテキストは不要）:
{"score": "A|B|C", "findings": ["指摘1", "指摘2"]}

スコア基準: A=問題なし、B=軽微な改善余地、C=要改善
` ` `

**エージェント 2: 構成（structure）レビュー**
- `description`: `レビュー: 構成`
- `prompt`:

` ` `
あなたは記事構成レビューの専門家です。以下の記事を構成の観点でレビューしてください。

記事タイトル: {article.title}
本文: {article.htmlContent}

評価基準:
- 導入→本題→まとめの論理フロー
- セクション間の繋がり
- 冗長箇所
- 情報の過不足

結果を以下の JSON のみで返してください（他のテキストは不要）:
{"score": "A|B|C", "findings": ["指摘1", "指摘2"]}

スコア基準: A=問題なし、B=軽微な改善余地、C=要改善
` ` `

**エージェント 3: 可読性（readability）レビュー**
- `description`: `レビュー: 可読性`
- `prompt`:

` ` `
あなたは可読性レビューの専門家です。以下の記事を可読性の観点でレビューしてください。

記事タイトル: {article.title}
本文: {article.htmlContent}

評価基準:
- 一文・段落の長さ
- 専門用語への説明
- 読者にとってのわかりやすさ

結果を以下の JSON のみで返してください（他のテキストは不要）:
{"score": "A|B|C", "findings": ["指摘1", "指摘2"]}

スコア基準: A=問題なし、B=軽微な改善余地、C=要改善
` ` `

**エージェント 4: 文体一貫性（styleConsistency）レビュー**
- `description`: `レビュー: 文体一貫性`
- `prompt`:

` ` `
あなたは文体一貫性レビューの専門家です。以下の記事を文体一貫性の観点でレビューしてください。

記事タイトル: {article.title}
本文: {article.htmlContent}

文体プロファイル（この文体に合っているかチェック）:
- 文体: {styleProfile.writingStyle}
- 語尾パターン: {styleProfile.sentenceEndings}
- トーン: {styleProfile.tone}
- 見出しパターン: {styleProfile.headingPattern}
- セクション構成: {styleProfile.sectionStructure}

評価基準:
- styleProfile との整合（語尾パターン、トーン、見出しパターン）

結果を以下の JSON のみで返してください（他のテキストは不要）:
{"score": "A|B|C", "findings": ["指摘1", "指摘2"]}

スコア基準: A=問題なし、B=軽微な改善余地、C=要改善
` ` `

**エージェント 5: 正確性（accuracy）レビュー**
- `description`: `レビュー: 正確性`
- `prompt`:

` ` `
あなたは正確性レビューの専門家です。以下の記事を正確性の観点でレビューしてください。

記事タイトル: {article.title}
本文: {article.htmlContent}

評価基準:
- 事実関係の疑わしい記述
- 古くなりそうな情報
- 誤解を招く表現

結果を以下の JSON のみで返してください（他のテキストは不要）:
{"score": "A|B|C", "findings": ["指摘1", "指摘2"]}

スコア基準: A=問題なし、B=軽微な改善余地、C=要改善
` ` `

3. すべてのサブエージェントの完了を待ってください。

4. 各サブエージェントの結果 JSON を対応するカテゴリキー（`seo`, `structure`, `readability`, `styleConsistency`, `accuracy`）にマッピングしてください。

#### 総合評価の算出

5カテゴリの結果を集約し、以下を算出してください：
- **overallScore**: 全カテゴリの最低スコアを採用（C が1つでもあれば C、B が1つでもあれば B、全て A なら A）
- **summary**: 総合的なレビューコメント（日本語で、各カテゴリの結果を踏まえた総括）

### 出力

結果を以下の JSON フォーマットで `output/review.json` に Write ツールで書き出してください：

` ` `json
{
  "reviewedAt": "ISO 8601形式の現在日時",
  "articleTitle": "記事タイトル",
  "categories": {
    "seo": { "score": "A|B|C", "findings": ["指摘1", "指摘2"] },
    "structure": { "score": "A|B|C", "findings": ["指摘1", "指摘2"] },
    "readability": { "score": "A|B|C", "findings": ["指摘1", "指摘2"] },
    "styleConsistency": { "score": "A|B|C", "findings": ["指摘1", "指摘2"] },
    "accuracy": { "score": "A|B|C", "findings": ["指摘1", "指摘2"] }
  },
  "overallScore": "A|B|C",
  "summary": "総合的なレビューコメント"
}
` ` `

### コンソール表示

レビュー結果を見やすくコンソールに表示してください：

1. 各カテゴリのスコアを一覧表示（A=✅、B=⚠️、C=❌）
2. C評価のカテゴリがあれば、該当する指摘を強調表示
3. 総合評価とサマリーを最後に表示

---

## Step 6: 最終確認 & WordPress 更新

### 6-1. 最終確認

AskUserQuestion ツールで最終確認を行ってください：

- `question`: 「この内容で WordPress を更新しますか？」
- `header`: 「最終確認」
- `options`:
  - 「更新する」: WP 更新を実行
  - 「修正に戻る」: Step 3 の修正ループに戻る
  - 「ローカル保存のみで終了」: WP 更新をスキップして完了

`$ARGUMENTS` に `--local` が含まれている場合は、このステップをスキップしてください。
`output/article.json` の保存のみで完了です。

### 6-2. WordPress 更新

「更新する」が選択された場合、以下の Bash コマンドを実行してください：

` ` `bash
npx tsx scripts/wp-update-post.ts {originalArticle.id} output/article.json
` ` `

更新が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

以下をまとめて報告してください：
- 記事タイトル
- 修正した箇所の概要（箇条書き）
- `output/article.json` のパス
- レビュー結果の総合評価（`output/review.json`）
- WordPress を更新した場合は編集 URL
```

**Step 2: コミット**

```bash
git add .claude/skills/edit/SKILL.md
git commit -m "feat: add /edit skill for interactive article editing"
```

---

## Task 2: CLAUDE.md を更新

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Skills & Commands セクションに `/edit` を追記**

`/revise <記事URL> --local` の下に以下を追加:

```markdown
# 既存記事の部分修正（対話形式でユーザー指示を正確に反映）
/edit <記事URL>

# 既存記事の部分修正（ローカル保存のみ、WP更新スキップ）
/edit <記事URL> --local
```

**Step 2: Architecture セクションに edit スキルを追記**

`.claude/skills/fact-check/SKILL.md` の行の下に以下を追加:

```
.claude/skills/edit/SKILL.md        ← 記事修正パイプライン定義（7ステップ）
```

**Step 3: パイプライン説明を追記**

ファクトチェックパイプラインの説明の下に以下を追加:

```markdown
### 記事修正パイプライン（`/edit`）

Step 0〜6 が実行される（Step 3 は修正完了までループ）:

0. **文体ロード** → `styleProfile`（キャッシュから。generate と同じロジック）
1. **既存記事取得** → `originalArticle`（URL→スラッグ→WP API）
2. **記事構造表示** → タイトル・見出し構造・文字数を表示
3. **修正ループ** → ユーザー指示に基づく部分修正（指示→反映→差分表示→繰り返し）
4. **記事書き出し** → `output/article.json`
5. **記事レビュー** → `output/review.json`（5カテゴリの並列サブエージェント）
6. **最終確認 & WP更新**（ユーザー承認後。`--local` 指定時はスキップ）
```

**Step 4: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: add /edit skill documentation to CLAUDE.md"
```

---

## Task 3: 動作確認

**Step 1: TypeScript 型チェック**

```bash
npx tsc --noEmit
```

Expected: 成功（TS ファイル変更なし）

**Step 2: スキルファイルの存在確認**

```bash
ls -la .claude/skills/edit/SKILL.md
```

Expected: ファイルが存在する

**Step 3: CLAUDE.md の内容確認**

`CLAUDE.md` に `/edit` の記載があることを確認:

```bash
grep -n "edit" CLAUDE.md
```

Expected: Skills & Commands、Architecture、パイプライン説明に `/edit` の記載がある
