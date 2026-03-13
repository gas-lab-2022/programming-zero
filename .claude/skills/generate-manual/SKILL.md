---
name: generate-manual
description: ツール利用マニュアル・API設定ガイドなどの操作手順記事を、ソースドキュメント（README等）をベースに生成する。SEO分析・差別化設計はスキップし、ソースの翻訳・整形に特化。
argument-hint: "[ソースファイルパス]"
---

あなたは WordPress ブログのツール利用マニュアル / 設定ガイド記事の生成パイプラインです。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。

**`/generate` との違い**: このスキルは README やドキュメントをソースとして、操作手順記事（マニュアル・設定ガイド）を生成します。SEO キーワード分析・競合分析・差別化設計はスキップし、ソースの正確な翻訳・整形に集中します。

---

## Step 0-pre: 対話による入力確認

ユーザーに以下を質問してください（`$ARGUMENTS` にソースファイルパスがあればそれを使用）：

```
以下の情報を教えてください：

1. ソースドキュメントのパス（README.md 等）
2. 生成する記事の種類（例: ツール利用マニュアル、API設定ガイド）
3. 関連記事の情報（任意。内部リンクを張る記事の URL とタイトル）
4. レビュー用の PR を作成しますか？（デフォルト: はい）
   ※ PR マージ時に GitHub Actions で WP に自動投稿されます
```

回答をもとに以下を設定：
- `sourcePath`: ソースドキュメントのファイルパス
- `articleType`: 記事の種類（`manual` or `guide`）
- `relatedArticles`: 関連記事の配列（`[{title, url}]`）。空配列可
- `isLocal`: PR を作成しない場合は true

ソースドキュメントを Read ツールで読み込み、`sourceContent` として保持してください。

以降、すべてのステップの結果をコンテキストとして保持し、最終的に PR を作成してください（`isLocal` が true の場合はスキップ）。

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

1. ソースドキュメントの内容からキーワードを推定し、スペースをハイフンに置換して `slug` を生成してください。
2. 以下の Bash コマンドでセッションディレクトリを作成してください：

```bash
SESSION_DIR="output/<domain>/$(date +%Y%m%d-%H%M%S)-<slug>"
mkdir -p "$SESSION_DIR"
echo "$SESSION_DIR"
```

出力されたパスを `sessionDir` として保持してください。

以降、すべての出力ファイルは `{sessionDir}/` 配下に書き出します。

---

## Step 0: 文体分析

`.claude/agents/style-loader.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `文体プロファイル読み込み`
- `prompt`: style-loader.md の内容

返却された JSON を `styleProfile` として保持してください。

---

## Step 1: ソース分析

あなたはテクニカルライティングの専門家です。

### コンテキスト
- `sourceContent`（ソースドキュメントの全文）
- `articleType`（記事の種類）
- `relatedArticles`（関連記事）

### タスク

ソースドキュメントを分析し、以下を整理してください：

1. **toolName**: ツール / サービスの正式名称
2. **toolPurpose**: ツールの目的・概要（1〜2文）
3. **features**: 主要機能のリスト
4. **setupSteps**: セットアップ手順（STEP 形式に整理）
5. **usageExamples**: 使い方の具体例
6. **constraints**: 制約事項・制限値（数値は正確に）
7. **cautions**: 注意事項・よくある落とし穴
8. **externalLinks**: ソースに含まれる外部リンク（公式ドキュメント等）
9. **qaItems**: Q&A にできそうな項目（3〜5個）

結果を `sourceAnalysis` として保持してください。

---

## Step 2: アウトライン作成

あなたは記事設計の専門家です。

### コンテキスト
- Step 0 の `styleProfile`（見出しパターン・セクション構成）
- Step 1 の `sourceAnalysis`
- `relatedArticles`

### 構成テンプレート

マニュアル / ガイド記事は以下の固定構成をベースにしてください：

```
導入（ツールの概要と本記事で解説する内容）

H2: {toolName}の概要
  - 主要機能の紹介
  - 特徴（H4 で 2〜3 個）
  - こんな方にオススメ

H2: {toolName}のご利用マニュアル / 設定手順
  H3: STEP1: ...
  H3: STEP2: ...
  ...
  （setupSteps に基づく）

H2: {データ一覧 / 設定項目一覧}（該当する場合のみ）

H2: ご利用上の注意点

H2: Q&A
  H3: 質問1
  H3: 質問2
  ...
```

`styleProfile` の見出しパターンに合わせて調整してください。

### タスク

以下を `outline` として保持してください：
- **title**: 記事タイトル（`styleProfile` の見出しパターンに合わせる）
- **metaDescription**: メタディスクリプション（120文字以内）
- **sections**: 各セクションの H2/H3/H4 見出し・要点
- **screenshotCandidates**: 自動撮影するスクリーンショット候補のリスト（任意。空配列可）。各候補：
  - `type`: `web` or `terminal`
  - `description`: 何を撮るか
  - `url`: 撮影対象URL（`web` のみ）
  - `cssSelector`: 特定要素のCSSセレクタ（`web` のみ、任意）
  - `altText`: 画像のalt属性テキスト
  - `insertAfter`: どのH2/H3見出しの直後に挿入するか
  - **重要**: Claude Code のターミナル UI スクリーンショットはモックアップではなくユーザーの実際の画面を使用する。`screenshotCandidates` に含めず、`manualTasks` に `type: cc-screenshot` として配置すること。
- **manualTasks**: ユーザーが手動で実施する必要がある実体験タスクのリスト（任意。空配列可）。各タスク：
  - `type`: `screenshot` / `cc-screenshot` / `terminal-output` / `text`
  - `description`: 具体的な作業内容
  - `purpose`: この情報が記事にとってなぜ重要か
  - `insertAfter`: どのH2/H3見出しの後に挿入するか
  - `altText`: 画像の場合のalt属性テキスト

---

## Step 3: 記事本文生成 & ファイル書き出し

あなたはプロのテクニカルライターです。

### コンテキスト
- Step 0 の `styleProfile`（文体指示）
- Step 2 の `outline`（構成）
- Step 1 の `sourceAnalysis`（ソースの正確なデータ）
- `relatedArticles`（内部リンク先）

### 文体指示（既存記事スタイルに合わせる）

`styleProfile` の以下を厳守してください：
- 文体（writingStyle）
- 語尾パターン（sentenceEndings）
- トーン（tone）
- 見出しパターン（headingPattern）
- セクション構成（sectionStructure）

### 執筆方針

- **ソースの正確な反映**: `sourceAnalysis` の数値・仕様・制約は正確に記事に反映する。独自の解釈や推測を加えない
- **操作手順は具体的に**: 各 STEP で「何をクリックするか」「何を入力するか」を明確に指示する
- **リスト中心の情報整理**: テーブルよりも箇条書き（`<ul>`, `<ol>`）を優先する。テーブルは比較や一覧表示が明らかに適切な場合のみ使用
- **吹き出しは使用しない**: マニュアル記事では吹き出し HTML パーツを使用しない
- H2/H3/H4 タグを適切に使用し、WordPress のブロックエディタと互換性のあるHTMLで出力
- タイトルは本文に含めない（WordPress が自動付与するため）
- **内部リンク（関連記事への動線）**: `relatedArticles` の URL が設定されている記事は、THE THOR テーマの `ep-box` スタイルで挿入する。以下のフォーマットを使用すること：
  ```html
  <div class="ep-box"><p>※参考：{関連記事の内容についての説明文}については下記の記事で詳しく解説しております。下記の記事をご参照の上、{具体的な作業内容}を進めてください。</p><ul><li><a href="{URL}" target="_blank" rel="noopener">{記事タイトル}</a></li></ul></div>
  ```
  - 導線は記事本文中の自然な位置（関連する操作手順の直前/直後）に配置する
  - 複数の関連記事がある場合は `<ul>` 内に `<li>` を複数追加する
- **外部リンク（一次情報）**: `sourceAnalysis.externalLinks` を活用し、公式ページへのリンクを本文中に自然に含める。リンクには `target="_blank" rel="noopener"` を付与する
- **スクリーンショットプレースホルダー**: `outline.screenshotCandidates` が空でない場合、各候補の `insertAfter` で指定された見出しセクション内に `<!-- SCREENSHOT:N -->` コメント（N は 0-indexed）を挿入する
- **手動タスクプレースホルダー**: `outline.manualTasks` が空でない場合、各タスクの `insertAfter` で指定された見出しセクション内に `<!-- HANDSON:N -->` コメント（N は 0-indexed）を挿入する

### 出力

以下の JSON を生成してください：

```json
{
  "title": "記事タイトル",
  "slug": "english-hyphenated-slug",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2", "タグ3"]
}
```

### slug（パーマリンク）の生成ルール

既存記事のスラッグスタイルに合わせるため、以下の Bash コマンドで直近20件のスラッグを取得してください：

```bash
node -e "
require('dotenv/config');
const s = process.env.WP_SITE_URL, u = process.env.WP_USERNAME, p = process.env.WP_APP_PASSWORD;
const c = Buffer.from(u+':'+p).toString('base64');
fetch(s+'/wp-json/wp/v2/posts?per_page=20&orderby=date&order=desc&_fields=slug,title',{headers:{Authorization:'Basic '+c}})
  .then(r=>r.json()).then(d=>d.forEach(x=>console.log(x.slug+'  ←  '+x.title.rendered)));
"
```

取得したスラッグの命名パターンを分析し、それに合わせたスラッグを生成してください。

**共通ルール（パターンに関わらず厳守）:**
1. 日本語は使わない（URLエンコードで長くなる・SNSシェア時に壊れるため）
2. 小文字とハイフンのみ使用
3. 短すぎず長すぎず（2〜6語程度）

生成した JSON を `{sessionDir}/article.json` にファイルとして書き出してください（Write ツールを使用）。

---

## Step 3.5: スクリーンショット生成 & 手動タスク書き出し

`outline.screenshotCandidates` と `outline.manualTasks` が両方とも空配列の場合、このステップをスキップしてください。

### 3.5-1〜4: スクリーンショット生成

`outline.screenshotCandidates` が空配列の場合、スクリーンショット関連のステップをスキップしてください。

Playwright MCP ツールが利用不可の場合もスキップし、`<!-- SCREENSHOT:N -->` プレースホルダーを記事 HTML から除去してください。

### 3.5-1. 撮影準備

```bash
mkdir -p {sessionDir}/screenshots
```

### 3.5-2. 各候補の撮影

`screenshotCandidates` の各候補（index = N）について順番に実行してください。

**type が `web` の場合:**

1. `mcp__playwright__browser_navigate` で `url` を開く
2. `mcp__playwright__browser_wait_for` で読み込み完了を待つ
3. `cssSelector` がある場合は `mcp__playwright__browser_snapshot` で要素の `ref` を特定
4. `mcp__playwright__browser_take_screenshot` で撮影（`cssSelector` 指定時は要素撮影、なければフルページ）
5. 保存先: `{sessionDir}/screenshots/screenshot-{N}.png`

**Google Sheets / Google サービスの撮影時の注意:**
- メニュー操作（「ファイル」→「コピーを作成」等）はログイン状態でないとグレーアウトして操作不可になる。ログインが必要な場合はユーザーに手動ログインを依頼する。
- Google アカウントの表示言語が日本語でない場合、UI が英語等で表示される。`myaccount.google.com/language` で日本語を優先言語に変更してから撮影し、撮影後に元に戻すこと。URL パラメータ `?hl=ja` はログイン済み状態では効かない。

**type が `terminal` の場合:**

1. Read ツールで `templates/terminal-mockup.html` を読み込む（初回のみ）
2. `description` をもとにリアルなターミナル出力を設計し、`{{TITLE}}` と `{{LINES}}` を置換
3. 置換済み HTML を Write ツールで `{sessionDir}/screenshots/_temp-terminal.html` に書き出す
4. Bash で HTTP サーバーを起動（初回のみ）: `python3 -m http.server 3847 --directory {sessionDir}/screenshots &`
5. `mcp__playwright__browser_navigate` で `http://localhost:3847/_temp-terminal.html` を開く
6. `mcp__playwright__browser_snapshot` で `.terminal` 要素の `ref` を特定
7. `mcp__playwright__browser_take_screenshot` で `.terminal` 要素を撮影
8. 保存先: `{sessionDir}/screenshots/screenshot-{N}.png`

ターミナル撮影終了後のクリーンアップ:

```bash
rm -f {sessionDir}/screenshots/_temp-terminal.html
kill $(lsof -ti:3847) 2>/dev/null
```

### 3.5-2.5. 機密情報のモザイク処理

撮影したスクリーンショットに **API キー・パスワード・トークン・シークレット** などの機密情報が映り込んでいる場合は、WP アップロード前にモザイク（ピクセレート）処理を施してください。

**対象**: 生成されたパスワード、アクセストークン、API キー、シークレットキーなど、そのまま公開すべきでない文字列。削除済み・無効化済みの値であってもモザイクをかけること（読者に不安を与えないため）。

**処理方法**（Python Pillow）:

```python
python3 << 'PYEOF'
from PIL import Image

img = Image.open("{sessionDir}/screenshots/screenshot-{N}.png")

# 機密情報が表示されている矩形領域の座標を指定
x1, y1, x2, y2 = <左>, <上>, <右>, <下>

region = img.crop((x1, y1, x2, y2))
small = region.resize((10, 3), Image.NEAREST)
mosaic = small.resize(region.size, Image.NEAREST)
img.paste(mosaic, (x1, y1))
img.save("{sessionDir}/screenshots/screenshot-{N}.png")
PYEOF
```

座標は Read ツールで画像を確認し、機密情報の表示位置を目視で特定してください。

### 3.5-2.7. 赤枠アノテーション

撮影したスクリーンショットに対し、ユーザーが注目すべき要素（ボタン、メニュー項目、入力欄、データセル、シートタブなど）に **赤い角丸矩形** を描画してください。

**スタイル仕様:**
- 色: `#CC3333`（RGB: 204, 51, 51）
- 線幅: 3px
- 角丸半径: 5px

**アノテーション対象の判断基準:**
- クリックすべきボタン・メニュー項目
- 入力すべきテキストフィールド
- 注目してほしいデータ行（ヘッダー行 + データ行をそれぞれ囲む）
- 操作対象のシートタブ
- その他、記事本文で「〜をクリック」「〜を入力」と指示している UI 要素

**処理順序**: モザイク処理（3.5-2.5）→ 赤枠アノテーション（本ステップ）→ WP アップロード（3.5-3）の順で実行すること。

**処理方法**（Python Pillow）:

```python
python3 << 'PYEOF'
from PIL import Image, ImageDraw

RED = (204, 51, 51)
STROKE = 3
RADIUS = 5

def annotate(path, rects, mosaic_regions=None):
    img = Image.open(path)
    if mosaic_regions:
        for region in mosaic_regions:
            x1, y1, x2, y2 = region
            crop = img.crop((x1, y1, x2, y2))
            w, h = crop.size
            small = crop.resize((max(w//10, 1), max(h//10, 1)), Image.NEAREST)
            mosaic = small.resize((w, h), Image.NEAREST)
            img.paste(mosaic, (x1, y1))
    draw = ImageDraw.Draw(img)
    for rect in rects:
        draw.rounded_rectangle(rect, radius=RADIUS, outline=RED, width=STROKE)
    img.save(path)

# 各スクリーンショットに対して実行
# annotate("{path}", [(x1,y1,x2,y2), ...])
PYEOF
```

座標は Read ツールで画像を確認し、アノテーション対象の UI 要素の位置を目視で特定してください。1 つのスクリーンショットに複数の矩形を描画できます。

### 3.5-3. WP メディアアップロード & 記事挿入

`isLocal` が true の場合は、`<!-- SCREENSHOT:N -->` プレースホルダーを記事 HTML から除去し、撮影したスクリーンショットのローカルパスをコンソールに表示して完了。

`isLocal` が false の場合、各スクリーンショットについて:

1. WP メディアライブラリにアップロード:

   ```bash
   npx tsx scripts/wp-upload-media.ts "{sessionDir}/screenshots/screenshot-{N}.png" "{altText}"
   ```

   出力される JSON から `url` を取得。

2. 記事 HTML 内の `<!-- SCREENSHOT:N -->` を以下に置換:

   ```html
   <figure class="wp-block-image"><img src="{url}" alt="{altText}" /></figure>
   ```

3. すべての置換が完了したら、更新した article.json を Write ツールで `{sessionDir}/article.json` に上書き保存。

### 3.5-4. 手動タスクの書き出し

`outline.manualTasks` が空でない場合、以下の JSON を `{sessionDir}/handson-tasks.json` に Write ツールで書き出してください：

```json
{
  "sessionDir": "{sessionDir}",
  "articleTitle": "{article.title}",
  "wpPostId": null,
  "tasks": [
    {
      "id": 0,
      "type": "screenshot | terminal-output | text",
      "description": "具体的な作業内容",
      "purpose": "記事にとっての重要性",
      "insertAfter": "見出しテキスト",
      "altText": "alt属性テキスト",
      "status": "pending"
    }
  ]
}
```

さらに、ユーザーが作業内容を把握できるよう `{sessionDir}/handson-tasks.md` も Write ツールで書き出してください。

書き出し後、コンソールに以下を表示してください：

```
手動タスク: {件数}件
  作業内容: {sessionDir}/handson-tasks.md
  機械読取用: {sessionDir}/handson-tasks.json
実施後に /incorporate {sessionDir} で記事に反映できます。
```

---

## Step 4: 記事レビュー

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

## Step 5: ファクトチェック

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

## Step 6: PR 作成（オプション）

`isLocal` が true の場合は、このステップをスキップしてください。

`isLocal` が false の場合は、以下の手順で PR を作成してください。

### 6-1. ブランチ作成

```bash
git checkout -b article/{domain}/{slug}
```

### 6-2. ファイル配置

`articles/{domain}/{slug}/` ディレクトリを作成し、ファイルを配置してください：

```bash
mkdir -p articles/{domain}/{slug}/screenshots
```

以下のファイルを Write ツールで `articles/{domain}/{slug}/` に書き出してください：

1. **article.json**: `{sessionDir}/article.json` の内容をそのままコピー
2. **review.md**: `{sessionDir}/review.md` の内容をそのままコピー
3. **fact-check.md**: `{sessionDir}/fact-check.md` の内容をそのままコピー

`{sessionDir}/screenshots/` にファイルがある場合は Bash でコピー：

```bash
cp {sessionDir}/screenshots/*.png articles/{domain}/{slug}/screenshots/ 2>/dev/null || true
```

### 6-3. WP 下書き投稿（プレビュー用）

記事を WordPress に下書き投稿して、プレビュー URL を取得します：

```bash
npx tsx scripts/wp-publish-draft.ts "articles/{domain}/{slug}/article.json"
```

出力から `Post ID` を取得し、以下を実行してください：

1. `articles/{domain}/{slug}/article.json` に `"wpPostId": {postId}` フィールドを追加（Edit ツール使用）
2. プレビュー URL を `previewUrl` として保持：`{WP_SITE_URL}/?p={postId}&preview=true`
3. 編集 URL を `editUrl` として保持：`{WP_SITE_URL}/wp-admin/post.php?post={postId}&action=edit`

### 6-3.5. アイキャッチ画像の生成 & 設定

記事のアイキャッチ（サムネイル / OGP 画像）を HTML + Playwright で生成し、WP に設定します。

**デザインパターン（articleType に応じて選択）:**

| articleType | スタイル | サイズ | 特徴 |
|---|---|---|---|
| `manual` | ダークテーマ | 720×377 | ダーク背景 + サービスロゴ + イラストアイコン + ツール名 |
| `guide` | ライトテーマ | 760×420 | ライト背景 + サービスカラーのグラデーション枠 + テキスト中央 |

**共通要素:**
- **GASラボバッジ**: 右下に `assets/gas-lab-icon.png` アイコン（52〜56px）+ 「GASラボ」ラベルを配置
- **フォント**: Google Fonts `Noto Sans JP`（ダークテーマ）/ `Noto Serif JP`（ライトテーマ）
- **サービスカラー**: 対象サービスのブランドカラーをアクセントに使用（例: Bluesky=#1185FE, Threads=#000000）

**手順:**

1. GASラボアイコンを Base64 エンコード:
   ```bash
   python3 -c "
   import base64
   with open('assets/gas-lab-icon.png', 'rb') as f:
       print(base64.b64encode(f.read()).decode())
   " > /tmp/gas-lab-icon-b64.txt
   ```

2. アイキャッチ用 HTML を作成（`{sessionDir}/screenshots/_temp-eyecatch.html`）:
   - `articleType` に応じてダーク / ライトテーマを選択
   - GASラボアイコンは `data:image/png;base64,...` で埋め込み
   - ダークテーマの場合:
     - 上部: サービスロゴ + 関連アイコン（SNS投稿・カレンダー等の SVG）
     - 下部: グラデーション背景 + ツール名テキスト（白・太字）
   - ライトテーマの場合:
     - 左右: サービスカラーのグラデーション枠（12px幅）
     - 上部: 波線装飾 + サブタイトル（「画像付き手順解説」等）
     - 中央: メインタイトル（明朝体・大文字）

3. HTTP サーバー経由でブラウザに表示:
   ```bash
   python3 -m http.server 3847 --directory {sessionDir}/screenshots &
   ```

4. Playwright でビューポートをアイキャッチサイズに設定:
   - `mcp__playwright__browser_resize` で width/height を設定
   - `mcp__playwright__browser_navigate` で HTML を開く

5. スクリーンショット撮影:
   - ダークテーマ: コンテナ要素を要素撮影（ビューポートより小さいため）
   - ライトテーマ: ビューポート全体を撮影

6. クリーンアップ:
   ```bash
   rm -f {sessionDir}/screenshots/_temp-eyecatch.html
   kill $(lsof -ti:3847) 2>/dev/null
   ```

7. WP メディアアップロード & アイキャッチ設定:
   ```bash
   npx tsx scripts/wp-upload-media.ts "{sessionDir}/screenshots/eyecatch.png" "{title}"
   ```
   出力から Media ID を取得し、WP API で `featured_media` に設定:
   ```bash
   node -e "
   require('dotenv/config');
   const s=process.env.WP_SITE_URL, u=process.env.WP_USERNAME, p=process.env.WP_APP_PASSWORD;
   const c=Buffer.from(u+':'+p).toString('base64');
   fetch(s+'/wp-json/wp/v2/posts/{postId}', {
     method:'POST',
     headers:{'Authorization':'Basic '+c,'Content-Type':'application/json'},
     body:JSON.stringify({featured_media:{mediaId}})
   }).then(r=>r.json()).then(d=>console.log('Featured media set:', d.featured_media));
   "
   ```

8. 画像を記事ディレクトリにもコピー:
   ```bash
   cp {sessionDir}/screenshots/eyecatch.png articles/{domain}/{slug}/screenshots/eyecatch.png
   ```

### 6-4. コミット & プッシュ

```bash
git add articles/{domain}/{slug}/
git commit -m "feat: add article '{title}'"
git push -u origin article/{domain}/{slug}
```

### 6-5. PR 作成

`gh pr create` で PR を作成してください。PR body は以下のテンプレートで生成：

```
gh pr create --title "article: {title}" --body "$(cat <<'PREOF'
## {title}

**Slug**: {slug}
**Meta Description**: {metaDescription}
**Tags**: {tags をカンマ区切り}
**Source**: `{sourcePath}`

### WP Preview（閲覧専用）
- [プレビュー]({previewUrl})（WP にログイン済みの状態で開いてください）
- [編集画面]({editUrl})
- ⚠️ WP 上での編集内容は PR マージ時に上書きされます。コンテンツの修正は PR 上で行ってください。

---

### Auto Review
- **Score**: {overallScore}/100
- {review.md の主要な指摘をサマリー（3行程度）}

### Fact Check
- **Verdict**: {overallVerdict}
- {fact-check.md の主要な結果をサマリー（3行程度）}

---

{manualTasks がある場合のみ以下のセクションを出力}
### Manual Tasks
- [ ] {task1 description}
- [ ] {task2 description}
...

---

### Review Checklist
- [ ] ソースドキュメントとの整合性
- [ ] 操作手順の正確性
- [ ] 内部リンクの動作確認
- [ ] 外部リンク（公式ドキュメント）の動作確認
PREOF
)"
```

PR が作成されたら、PR URL を取得して表示してください。

---

## 完了

すべてのステップが完了しました。以下をまとめて報告してください：
- 記事タイトル
- `{sessionDir}/article.json` のパス（ローカル作業用）
- レビュー結果の総合評価（`{sessionDir}/review.md`）
- ファクトチェック結果の総合判定（`{sessionDir}/fact-check.md`）
- PR を作成した場合は PR URL
- WP プレビュー URL（PR 作成時）
- 手動タスクがある場合: 件数と作業手順
