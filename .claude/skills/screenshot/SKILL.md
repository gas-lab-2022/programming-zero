---
name: screenshot
description: Playwright MCP を使って Web ページまたはターミナルモックアップのスクリーンショットを撮影する。
disable-model-invocation: true
---

あなたはスクリーンショット撮影ツールです。Playwright MCP サーバーを使って、Web ページまたはターミナルモックアップのスクリーンショットを撮影します。

---

## ドメイン取得

`.env` の `WP_SITE_URL` からドメインを取得してください：

```bash
DOMAIN=$(grep WP_SITE_URL .env | sed 's|.*://||' | sed 's|/.*||')
echo "$DOMAIN"
```

取得した値を `domain` として保持してください。

---

## Step 0-pre: 対話による入力確認

ユーザーに撮影モードを確認してください：

```
どのモードで撮影しますか？

1. Web — Webページのスクリーンショット
2. Terminal — ターミナル風モックアップのスクリーンショット
```

**Web を選択した場合:**

```
撮影するURLを教えてください（例: https://example.com）
特定の要素だけ撮影しますか？（CSSセレクタを指定、不要ならスキップ）
```

設定:
- `mode`: `web`
- `targetUrl`: ユーザーが指定したURL
- `cssSelector`: 指定があれば設定、なければ null
- `outputDir`: `output/{domain}/screenshots/`（デフォルト）

**Terminal を選択した場合:**

```
ターミナルに表示する内容を教えてください（コマンドと出力の説明）
```

設定:
- `mode`: `terminal`
- `description`: ユーザーが指定した説明
- `outputDir`: `output/{domain}/screenshots/`（デフォルト）

---

## モード判定

`mode` の値に応じて以下のモードを実行してください：

- `mode` が `web` → **Mode A: Web 撮影**
- `mode` が `terminal` → **Mode B: ターミナルモック撮影**

---

## Mode A: Web 撮影

1. **出力ディレクトリの準備**

   Bash ツールで出力ディレクトリを作成してください：

   ```bash
   mkdir -p {outputDir}
   ```

2. **ページを開く**

   `mcp__playwright__browser_navigate` で `targetUrl` を開いてください。

3. **読み込み待機**

   `mcp__playwright__browser_wait_for` でページの読み込み完了を待ってください（`networkidle` など適切な条件を使用）。

4. **撮影**

   - `cssSelector` が指定されている場合：
     1. `mcp__playwright__browser_snapshot` でページ構造を取得する
     2. `cssSelector` に該当する要素の `ref` を特定する
     3. `mcp__playwright__browser_take_screenshot` でその要素を撮影する
   - `cssSelector` が null の場合：
     1. `mcp__playwright__browser_take_screenshot` でフルページ撮影する

5. **ファイル名**

   保存ファイル名は以下の形式にしてください：

   ```
   web-{domain}{path-slugified}-{YYYYMMDD-HHMMSS}.png
   ```

   例: `https://example.com/blog/post` → `web-example.com-blog-post-20260305-143000.png`

6. **結果報告**

   撮影モード・保存先パス・撮影内容の簡潔な説明を報告してください。

---

## Mode B: ターミナルモック撮影

1. **出力ディレクトリの準備**

   Bash ツールで出力ディレクトリを作成してください：

   ```bash
   mkdir -p {outputDir}
   ```

2. **テンプレートの読み込み**

   Read ツールで `templates/terminal-mockup.html` を読み込んでください。

3. **ターミナル表示内容の設計**

   `description` をもとに、ターミナルに表示するコマンドと出力を設計してください。以下の HTML 要素を組み合わせて `{{LINES}}` に入れる行を構築します：

   - **プロンプト行**: `<div class="line"><span class="prompt">$ </span><span class="command">コマンド</span></div>`
   - **出力行**: `<div class="line"><span class="output">テキスト</span></div>`
   - **強調テキスト**: `<span class="highlight">テキスト</span>`
   - **情報テキスト**: `<span class="info">テキスト</span>`
   - **エラーテキスト**: `<span class="error">テキスト</span>`
   - **コメント行**: `<div class="line"><span class="comment"># テキスト</span></div>`
   - **空行**: `<div class="line"></div>`

   `description` の意図を汲み取り、リアルなターミナル出力になるよう工夫してください。

4. **テンプレートの置換**

   - `{{TITLE}}` → `description` から適切なタイトルを生成して置換
   - `{{LINES}}` → 手順 3 で構築した HTML 行で置換

5. **一時ファイルの書き出し**

   置換済み HTML を Write ツールで `{outputDir}/_temp-terminal.html` に書き出してください。

6. **HTTP サーバー経由でブラウザに表示**

   Playwright MCP は `file://` プロトコルをサポートしていないため、HTTP サーバー経由で配信します。

   Bash ツールでバックグラウンドで HTTP サーバーを起動してください：

   ```bash
   python3 -m http.server 3847 --directory {outputDir} &
   ```

   `mcp__playwright__browser_navigate` で `http://localhost:3847/_temp-terminal.html` を開いてください。

7. **要素の特定**

   `mcp__playwright__browser_snapshot` でページ構造を取得し、`.terminal` 要素の `ref` を特定してください。

8. **撮影**

   `mcp__playwright__browser_take_screenshot` で `.terminal` 要素を撮影してください。

9. **ファイル名のリネーム**

   撮影した画像ファイルを適切な名前にリネームしてください：

   ```
   terminal-{slugified-description}-{YYYYMMDD-HHMMSS}.png
   ```

   `slugified-description` は `description` の先頭30文字程度をスラッグ化（スペースをハイフンに置換、記号除去）した文字列です。

10. **クリーンアップ**

    一時ファイルの削除と HTTP サーバーの停止を行ってください：

    ```bash
    rm {outputDir}/_temp-terminal.html
    kill $(lsof -ti:3847) 2>/dev/null
    ```

11. **結果報告**

    撮影モード・保存先パス・撮影内容の簡潔な説明を報告してください。

---

## 機密情報のモザイク処理

撮影したスクリーンショットに **API キー・パスワード・トークン・シークレット** などの機密情報が映り込んでいる場合は、モザイク（ピクセレート）処理を施してください。

**対象**: 生成されたパスワード、アクセストークン、API キー、シークレットキーなど、そのまま公開すべきでない文字列。削除済み・無効化済みの値であってもモザイクをかけること（読者に不安を与えないため）。

**処理方法**（Python Pillow）:

```python
python3 << 'PYEOF'
from PIL import Image

img = Image.open("{撮影した画像パス}")

# 機密情報が表示されている矩形領域の座標を指定
x1, y1, x2, y2 = <左>, <上>, <右>, <下>

region = img.crop((x1, y1, x2, y2))
small = region.resize((10, 3), Image.NEAREST)
mosaic = small.resize(region.size, Image.NEAREST)
img.paste(mosaic, (x1, y1))
img.save("{撮影した画像パス}")
PYEOF
```

座標は Read ツールで画像を確認し、機密情報の表示位置を目視で特定してください。

---

## 完了

撮影結果をまとめて報告してください：

- **撮影モード**: web または terminal
- **保存先パス**: 画像ファイルの絶対パス
- **撮影内容**: 何を撮影したかの簡潔な説明
