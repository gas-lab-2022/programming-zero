---
name: screenshot
description: Playwright MCP を使って Web ページまたはターミナルモックアップのスクリーンショットを撮影する。
argument-hint: "web <URL> [--output path] [--selector CSS] | terminal <説明テキスト> [--output path]"
disable-model-invocation: true
---

あなたはスクリーンショット撮影ツールです。Playwright MCP サーバーを使って、Web ページまたはターミナルモックアップのスクリーンショットを撮影します。

以下の手順で `$ARGUMENTS` を解析し、適切なモードで撮影を実行してください。

---

## 引数の解析

`$ARGUMENTS` を以下のルールで解析してください：

- 先頭のトークンが `web` → **Web 撮影モード（Mode A）**
- 先頭のトークンが `terminal` → **ターミナルモック撮影モード（Mode B）**

### 共通オプション

- `--output <path>`: 出力ディレクトリ（デフォルト: `output/screenshots/`）

### Mode A 固有オプション

- 2番目のトークン: 撮影対象 URL
- `--selector <CSS>`: 特定要素のみ撮影する CSS セレクタ

### Mode B 固有オプション

- `web` / `terminal` キーワードとオプションフラグを除いた残りのテキスト全体が「説明テキスト」

---

## Mode A: Web 撮影

1. **出力ディレクトリの準備**

   Bash ツールで出力ディレクトリを作成してください：

   ```bash
   mkdir -p {output-dir}
   ```

2. **ページを開く**

   `mcp__playwright__browser_navigate` で指定された URL を開いてください。

3. **読み込み待機**

   `mcp__playwright__browser_wait_for` でページの読み込み完了を待ってください（`networkidle` など適切な条件を使用）。

4. **撮影**

   - `--selector` が指定されている場合：
     1. `mcp__playwright__browser_snapshot` でページ構造を取得する
     2. 指定された CSS セレクタに該当する要素の `ref` を特定する
     3. `mcp__playwright__browser_take_screenshot` でその要素を撮影する
   - `--selector` が指定されていない場合：
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
   mkdir -p {output-dir}
   ```

2. **テンプレートの読み込み**

   Read ツールで `templates/terminal-mockup.html` を読み込んでください。

3. **ターミナル表示内容の設計**

   ユーザーの説明テキストをもとに、ターミナルに表示するコマンドと出力を設計してください。以下の HTML 要素を組み合わせて `{{LINES}}` に入れる行を構築します：

   - **プロンプト行**: `<div class="line"><span class="prompt">$ </span><span class="command">コマンド</span></div>`
   - **出力行**: `<div class="line"><span class="output">テキスト</span></div>`
   - **強調テキスト**: `<span class="highlight">テキスト</span>`
   - **情報テキスト**: `<span class="info">テキスト</span>`
   - **エラーテキスト**: `<span class="error">テキスト</span>`
   - **コメント行**: `<div class="line"><span class="comment"># テキスト</span></div>`
   - **空行**: `<div class="line"></div>`

   説明テキストの意図を汲み取り、リアルなターミナル出力になるよう工夫してください。

4. **テンプレートの置換**

   - `{{TITLE}}` → 説明テキストから適切なタイトルを生成して置換
   - `{{LINES}}` → 手順 3 で構築した HTML 行で置換

5. **一時ファイルの書き出し**

   置換済み HTML を Write ツールで `{output-dir}/_temp-terminal.html` に書き出してください。

6. **HTTP サーバー経由でブラウザに表示**

   Playwright MCP は `file://` プロトコルをサポートしていないため、HTTP サーバー経由で配信します。

   Bash ツールでバックグラウンドで HTTP サーバーを起動してください：

   ```bash
   python3 -m http.server 3847 --directory {output-dir} &
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

   `slugified-description` は説明テキストの先頭30文字程度をスラッグ化（スペースをハイフンに置換、記号除去）した文字列です。

10. **クリーンアップ**

    一時ファイルの削除と HTTP サーバーの停止を行ってください：

    ```bash
    rm {output-dir}/_temp-terminal.html
    kill $(lsof -ti:3847) 2>/dev/null
    ```

11. **結果報告**

    撮影モード・保存先パス・撮影内容の簡潔な説明を報告してください。

---

## 完了

撮影結果をまとめて報告してください：

- **撮影モード**: web または terminal
- **保存先パス**: 画像ファイルの絶対パス
- **撮影内容**: 何を撮影したかの簡潔な説明
