---
name: edit
description: WordPress上の既存記事をユーザーの修正指示に基づいて対話的に部分修正するパイプライン。指示された箇所だけを正確に変更し、それ以外は一切変えない。
argument-hint: "<記事URL> [--local]"
disable-model-invocation: true
---

あなたは WordPress ブログの記事修正エージェントです。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。
以下の手順を実行し、ユーザーの修正指示に基づいて既存記事を正確に部分修正してください。

**重要なルール:**
- ユーザーが指示した箇所**だけ**を変更し、それ以外の部分は一切変えないでください
- `/revise` のような全面リライトではなく、外科的な部分修正に徹してください

---

## セッションディレクトリの作成

複数セッションの同時実行でファイルが競合しないよう、セッション固有の出力ディレクトリを使用します。

### 手順

1. `$ARGUMENTS` から記事 URL を抽出し、URL のスラッグ部分を取得してください（`--local` フラグは除外）。
   - 例: `https://example.com/react-hooks-guide/` → `react-hooks-guide`
   - 例: `https://example.com/?p=123` → `p123`
2. 以下の Bash コマンドでセッションディレクトリを作成してください（`<slug>` は手順 1 の値に置換）：

```bash
SESSION_DIR="output/$(date +%Y%m%d-%H%M%S)-edit-<slug>"
mkdir -p "$SESSION_DIR"
echo "$SESSION_DIR"
```

3. 出力されたパスを `sessionDir` として保持してください（例: `output/20260305-143000-edit-react-hooks-guide`）。

以降、すべての出力ファイルは `{sessionDir}/` 配下に書き出します。

---

## Step 0: 文体ロード

`.claude/agents/style-loader.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `文体プロファイル読み込み`
- `prompt`: style-loader.md の内容 + 末尾に `\n\nrefreshStyle: false`

返却された JSON を `styleProfile` として保持してください。

---

## Step 1: 既存記事取得

### 手順

`$ARGUMENTS` から記事 URL を抽出してください（`--local` などのフラグは除外）。

以下の Bash コマンドで既存記事を取得してください：

```bash
npx tsx scripts/wp-fetch-post-by-url.ts <記事URL>
```

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

```
## 記事の構造

タイトル: 「プログラミング入門ガイド」
URL: https://example.com/programming-guide/

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
```

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

```
### 変更 1/N: {変更の概要}
Before: 「変更前のテキスト」
After:  「変更後のテキスト」
```

- 追加の場合は Before なしで After のみ表示（「（新規追加）」と注記）
- 削除の場合は After なしで Before のみ表示（「（削除）」と注記）
- 変更箇所が長い場合は、変更部分の前後を含む適切な範囲で引用

### 3-4. 継続確認

差分を表示したら、3-1 に戻って次の修正指示を待ってください。

---

## Step 4: article.json 書き出し

### タスク

`currentArticle` を `{sessionDir}/article.json` に書き出してください。

### フォーマット

```json
{
  "title": "記事タイトル（currentArticle.title）",
  "htmlContent": "記事本文HTML（currentArticle.content）",
  "metaDescription": "メタディスクリプション（既存記事から抽出、またはタイトルから生成）",
  "tags": []
}
```

Write ツールで `{sessionDir}/article.json` に書き出してください。

---

## Step 5: 記事レビュー

`{sessionDir}/article.json` を Read ツールで読み込み、`article` として保持してください。

`.claude/agents/article-reviewer.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `記事レビュー実行`
- `prompt`: article-reviewer.md の内容 + 末尾に以下を付与：

```
outputPath: {sessionDir}/review.json
styleProfile: {styleProfile の JSON}
article: {article の JSON}
```

エージェントが `{sessionDir}/review.json` を書き出します。返却テキストからスコアとサマリーを取得してください。

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
`{sessionDir}/article.json` の保存のみで完了です。

### 6-2. WordPress 更新

「更新する」が選択された場合、以下の Bash コマンドを実行してください：

```bash
npx tsx scripts/wp-update-post.ts {originalArticle.id} {sessionDir}/article.json
```

更新が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

以下をまとめて報告してください：
- 記事タイトル
- 修正した箇所の概要（箇条書き）
- `{sessionDir}/article.json` のパス
- レビュー結果の総合評価（`{sessionDir}/review.json`）
- WordPress を更新した場合は編集 URL
