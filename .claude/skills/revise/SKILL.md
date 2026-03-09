---
name: revise
description: WordPress上の既存記事をSEO再調査・診断に基づいてリライトし、記事を更新するパイプライン。
argument-hint: "[記事URL]"
disable-model-invocation: true
---

あなたは WordPress ブログの記事リライトパイプラインです。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。

---

## Step 0-pre: 対話による入力確認

`$ARGUMENTS` に記事URLが含まれていない場合は、ユーザーに質問してください：

```
リライトする記事のURLを教えてください（例: https://example.com/article-slug/）
```

次に、以下のオプションを確認してください：

```
以下のオプションを確認します：
1. WordPress の記事を更新しますか？（デフォルト: はい）
```

回答をもとに以下を設定：
- `articleUrl`: リライト対象の記事URL
- `isLocal`: WP更新しない場合は true

以降、すべてのステップの結果をコンテキストとして保持し、最終的に WordPress の既存記事を更新してください（`isLocal` が true の場合はスキップ）。

---

## ドメイン取得 & セッションディレクトリの作成

### ドメイン取得

`.env` の `WP_SITE_URL` からドメインを取得し、以降のパスの基点として使用します：

```bash
DOMAIN=$(grep WP_SITE_URL .env | sed 's|.*://||' | sed 's|/.*||')
echo "$DOMAIN"
```

取得した値を `domain` として保持してください（例: `programming-zero.net`）。

### セッションディレクトリの作成

複数セッションの同時実行でファイルが競合しないよう、セッション固有の出力ディレクトリを使用します。

### 手順

1. `articleUrl` からURL のスラッグ部分を取得してください。
   - 例: `https://example.com/react-hooks-guide/` → `react-hooks-guide`
   - 例: `https://example.com/?p=123` → `p123`
2. 以下の Bash コマンドでセッションディレクトリを作成してください（`<slug>` は手順 1 の値に置換、`<domain>` は上記で取得した値に置換）：

```bash
SESSION_DIR="output/<domain>/$(date +%Y%m%d-%H%M%S)-revise-<slug>"
mkdir -p "$SESSION_DIR"
echo "$SESSION_DIR"
```

3. 出力されたパスを `sessionDir` として保持してください（例: `output/programming-zero.net/20260305-143000-revise-react-hooks-guide`）。

以降、すべての出力ファイルは `{sessionDir}/` 配下に書き出します。

---

## Step 0: 文体ロード

`.claude/agents/style-loader.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `文体プロファイル読み込み`
- `prompt`: style-loader.md の内容

返却された JSON を `styleProfile` として保持してください。

---

## Step 1: 既存記事取得

あなたは記事分析の専門家です。

### 手順

以下の Bash コマンドで既存記事を取得してください：

```bash
npx tsx scripts/wp-fetch-post-by-url.ts {articleUrl}
```

取得結果を `originalArticle` として保持してください。以下のフィールドを含みます：
- **id**: 記事の Post ID（Step 8 で更新時に使用）
- **title**: 記事タイトル
- **content**: 記事本文（HTML）
- **slug**: URLスラッグ
- **link**: 記事URL

取得に失敗した場合は、エラーメッセージを表示して処理を中断してください。

---

## Step 2: 記事診断

あなたは記事品質診断の専門家です。

### コンテキスト
- Step 0 の `styleProfile`
- Step 1 の `originalArticle`

### タスク

既存記事を以下の4つの観点で診断してください：

1. **SEO**: タイトルの長さと訴求力、メタ情報の有無、見出し構造（H2/H3の階層）、キーワードの配置と密度
2. **構成**: 論理フロー（導入→本題→まとめ）の整合性、セクション粒度の適切さ、冗長な箇所や繰り返し
3. **可読性**: 一文の長さ、段落の長さ、専門用語への説明の有無、読者にとってのわかりやすさ
4. **情報鮮度**: 古くなっている情報、リンク切れの可能性、最新のベストプラクティスとの乖離

各カテゴリについて、**問題点**と**具体的な改善提案**を箇条書きで出力してください。

結果を `diagnosis` として保持してください。

---

## Step 3: SEO再調査（WebSearch 使用）

あなたはSEO分析の専門家です。

### コンテキスト
- Step 1 の `originalArticle`（タイトル・内容からメインキーワードを特定）
- Step 2 の `diagnosis`

### タスク

既存記事のメインキーワードを特定し、**WebSearch ツールで実際に検索** してください。

検索結果をもとに以下を分析：

1. **topArticles**: 現在の上位記事（最大10件）のURL・タイトル・要約を収集
2. **commonStructure**: 上位記事に共通する構造パターンを抽出
3. **mustCoverTopics**: 上位記事が共通してカバーしている必須トピックを特定
4. **gapOpportunities**: 既存記事に不足している点（上位記事がカバーしているが自記事にないもの）
5. **existingStrengths**: 既存記事が上位記事より優れている点（残すべき強み）

結果を `seoAnalysis` として保持してください。

---

## Step 4: リライト方針

あなたはコンテンツ戦略の専門家です。

### コンテキスト
- Step 0 の `styleProfile`
- Step 1 の `originalArticle`
- Step 2 の `diagnosis`
- Step 3 の `seoAnalysis`

### タスク

以下の3つの観点でリライト方針を策定してください：

1. **残す部分（strengths）**: 既存記事の強み・良い部分で、そのまま残すべき箇所とその理由
2. **改善する部分（improvements）**: 変更すべき箇所と具体的な変更方針（書き換え・追記・削除など）
3. **追加・削除セクション（structureChanges）**: 新規追加すべきセクションと削除すべきセクション

原則として、既存記事の良い部分は最大限活かし、問題点のみを改善してください。
全面的な書き換えではなく、外科的な改善を目指してください。

結果を `revisionPlan` として保持してください。

---

## Step 5: 本文リライト & ファイル書き出し

あなたはプロのWebライターです。

### コンテキスト
- Step 0 の `styleProfile`（文体指示）
- Step 1 の `originalArticle`（元の記事）
- Step 4 の `revisionPlan`（リライト方針）

### 文体指示（既存記事スタイルに合わせる）

`styleProfile` の以下を厳守してください：
- 文体（writingStyle）
- 語尾パターン（sentenceEndings）
- トーン（tone）
- 見出しパターン（headingPattern）
- セクション構成（sectionStructure）

### リライト方針

- `revisionPlan` の **残す部分** はできるだけそのまま維持する
- `revisionPlan` の **改善する部分** を反映する
- `revisionPlan` の **追加・削除セクション** を反映する
- 読者の不安を先回りして解消する
- **表現形式のバリエーション**: 箇条書き・番号付きリスト・テーブル・会話調の散文・Q&A形式など、セクションごとに異なる表現形式を使い分ける。同じパターン（例: 「①太字見出し + 説明文」）が3セクション以上連続しないようにする
- H2/H3タグを適切に使用し、WordPress のブロックエディタと互換性のあるHTMLで出力
- タイトルは本文に含めない（WordPressが自動付与するため）
- **吹き出し（体験談）**: 体験談・一次情報に基づく感想・気づき・注意点は、テーマの吹き出し HTML パーツで表現する。`docs/wp-theme-the-thor.md` の「吹き出し」セクションを Read ツールで読み込み、HTML 構造と使用ルールに従うこと。

### 出力

以下の JSON を生成してください：

```json
{
  "title": "記事タイトル",
  "slug": "既存記事のスラッグをそのまま使用",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2", "タグ3"]
}
```

**slug**: `originalArticle.slug` をそのまま使用してください（既存のパーマリンクを変更しない）。

生成した JSON を `{sessionDir}/article.json` にファイルとして書き出してください（Write ツールを使用）。

---

## Step 6: 記事レビュー

`{sessionDir}/article.json` を Read ツールで読み込み、`article` として保持してください。

`.claude/agents/article-reviewer.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `記事レビュー実行`
- `prompt`: article-reviewer.md の内容 + 末尾に以下を付与：

```
outputPath: {sessionDir}/review.md
styleProfile: {styleProfile の JSON}
article: {article の JSON}
```

エージェントが `{sessionDir}/review.md` を書き出します。返却テキストからスコアとサマリーを取得してください。

---

## Step 7: ファクトチェック

`.claude/agents/fact-checker.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `ファクトチェック実行`
- `prompt`: fact-checker.md の内容 + 末尾に以下を付与：

```
outputPath: {sessionDir}/fact-check.md
article: {article の JSON}
```

エージェントが `{sessionDir}/fact-check.md` を書き出します。返却テキストから総合判定とサマリーを取得してください。

---

## Step 8: WordPress 記事更新（オプション）

`isLocal` が true の場合は、このステップをスキップしてください。
`{sessionDir}/article.json` の保存のみで完了です。

`isLocal` が false の場合は、以下の Bash コマンドを実行して WordPress の既存記事を更新してください：

```bash
npx tsx scripts/wp-update-post.ts {originalArticle.id} {sessionDir}/article.json
```

`{originalArticle.id}` は Step 1 で取得した Post ID に置き換えてください。

更新が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

すべてのステップが完了しました。以下をまとめて報告してください：
- 元の記事タイトル → リライト後のタイトル
- 主な改善点（箇条書き3〜5個）
- `{sessionDir}/article.json` のパス
- レビュー結果の総合評価（`{sessionDir}/review.md`）
- ファクトチェック結果の総合判定（`{sessionDir}/fact-check.md`）
- WordPress を更新した場合は編集 URL
