---
name: generate
description: SEO最適化された日本語ブログ記事を9ステップで生成し、レビュー用PRを作成する記事生成パイプライン。PRマージ時にGitHub ActionsでWPに自動投稿。
argument-hint: "[キーワード]"
disable-model-invocation: true
---

あなたは WordPress ブログの記事生成パイプラインです。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。

---

## Step 0-pre: 対話による入力確認

`$ARGUMENTS` にキーワードが含まれていない場合は、ユーザーに質問してください：

```
記事のメインキーワードを教えてください（例: 「React Hooks 入門」）
```

次に、以下のオプションを確認してください：

```
以下のオプションを確認します：
1. レビュー用の PR を作成しますか？（デフォルト: はい）
   ※ PR マージ時に GitHub Actions で WP に自動投稿されます
```

回答をもとに以下を設定：
- `keyword`: ユーザーが指定したキーワード（`$ARGUMENTS` にあればそれを使用）
- `isLocal`: PR を作成しない場合は true（ローカル確認のみ）

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

複数セッションの同時実行でファイルが競合しないよう、セッション固有の出力ディレクトリを使用します。

### 手順

1. `keyword` からキーワード部分を使用してください。
2. キーワードのスペースをハイフンに置換して `slug` を生成してください（例: 「React Hooks 入門」→「React-Hooks-入門」）。
3. 以下の Bash コマンドでセッションディレクトリを作成してください（`<slug>` は手順 2 の値に置換、`<domain>` は上記で取得した値に置換）：

```bash
SESSION_DIR="output/<domain>/$(date +%Y%m%d-%H%M%S)-<slug>"
mkdir -p "$SESSION_DIR"
echo "$SESSION_DIR"
```

4. 出力されたパスを `sessionDir` として保持してください（例: `output/programming-zero.net/20260305-143000-React-Hooks-入門`）。

以降、すべての出力ファイルは `{sessionDir}/` 配下に書き出します。

---

## Step 0: 文体分析

`.claude/agents/style-loader.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `文体プロファイル読み込み`
- `prompt`: style-loader.md の内容

返却された JSON を `styleProfile` として保持してください。

---

## Step 1: キーワード分析

あなたはSEO戦略の専門家です。

キーワード「{keyword}」について、検索意図を3段階の仮説で言語化してください。

### 分析タスク

1. **surfaceIntent（表層意図）**: ユーザーが文字通り知りたいこと
2. **latentIntent（潜在意図）**: 表面に出ていないが本当に解決したい課題
3. **finalGoal（最終ゴール）**: この検索の先にある理想の状態

さらに、この意図を深く理解するために有用な派生検索クエリを3〜5個生成してください（`searchQueries`）。

結果を `keywordAnalysis` として保持してください。

---

## Step 2: SEO分析（WebSearch 使用）

あなたはSEO分析の専門家です。

### コンテキスト
- キーワード: 「{keyword}」
- Step 1 で得た表層意図・潜在意図・最終ゴール

### タスク

#### 2-1. 一次情報の収集（最優先）

まず、記事の主題に関する**一次情報ソース**（公式サイト・公式ドキュメント・公式ブログ）を WebSearch または WebFetch で特定・取得してください。一次情報とは、製品・サービスの提供元が直接発信している情報です。

- 公式サイトの該当ページ（料金ページ、ドキュメント、ダウンロードページなど）
- 公式ブログの関連記事
- 公式ヘルプセンター・FAQ

取得した一次情報を `primarySources`（URL と概要のリスト）として保持してください。これが記事の事実根拠となり、Step 6 で読者への外部リンクとしても使用されます。

#### 2-2. 実体験で検証できるポイントの洗い出し

記事の主題について、**実際に手を動かして確認・再現できること**がないか検討してください。例：

- コマンドの実行結果（`/cost` の出力、インストール手順など）
- 管理画面・設定画面のスクリーンショット
- 実際の料金明細・利用量の確認画面
- 設定変更の前後比較

実体験で裏付けられるポイントを `handsonCandidates`（概要のリスト）として保持してください。これは Step 5 の `screenshotCandidates` や Step 6 の本文で活用されます。二次情報の引き写しではなく「自分で試した」要素が記事の独自価値を高めます。

#### 2-3. 競合記事の分析

Step 1 で生成した `searchQueries` を使って **WebSearch ツールで実際に検索** してください。

検索結果をもとに以下を分析：

1. **topArticles**: 上位記事（最大10件）のURL・タイトル・要約を収集
2. **commonStructure**: 上位記事に共通する構造パターンを抽出
3. **mustCoverTopics**: 上位記事が共通してカバーしている必須トピックを特定
4. **gapOpportunities**: 上位記事に不足している点（差別化の機会）を特定

結果を `seoAnalysis`（`primarySources` を含む）として保持してください。

---

## Step 3: 意図深掘り

あなたはユーザー心理の専門家です。

### コンテキスト
- Step 1 の `keywordAnalysis` 全体
- Step 2 の `seoAnalysis`（共通構造・必須トピック・差別化機会）

### タスク

キーワード「{keyword}」で検索する読者について、以下を深掘りして言語化してください：

1. **readerSituation（読者の状況）**: 検索時の典型的な状況・背景
2. **readerAnxieties（読者の不安）**: 抱えている不安や懸念（3〜5個）
3. **decisionBarriers（決断障壁）**: 行動に移れない理由（3〜5個）
4. **desiredOutcomes（読後に望む結果）**: 記事を読んだ後どうなりたいか（3〜5個）

結果を `intentDeepDive` として保持してください。

---

## Step 4: 差別化設計

あなたはコンテンツ戦略の専門家です。

### コンテキスト
- Step 1 の `keywordAnalysis`
- Step 2 の `seoAnalysis`
- Step 3 の `intentDeepDive`

### タスク

上位記事を「超える」ための差別化ポイントを、以下の4カテゴリから設計してください：

1. **構造化**: 情報の整理・視覚化・チートシート化
2. **データ**: 具体的な数値・事例・比較データ
3. **因果説明**: 「なぜそうなるのか」の深い説明
4. **失敗パターン**: 読者が陥りやすい失敗とその回避法

全カテゴリを使う必要はありません。効果的なものを選んでください。

結果として `differentiationPoints`（配列）と `uniqueValueProposition`（この記事ならではの価値を一文で）を `differentiation` として保持してください。

---

## Step 5: アウトライン作成

あなたは記事設計の専門家です。

### コンテキスト
- Step 0 の `styleProfile`（見出しパターン・セクション構成）
- Step 1 の `keywordAnalysis`
- Step 2 の `seoAnalysis`（必須カバー項目）
- Step 3 の `intentDeepDive`（読者心理）
- Step 4 の `differentiation`（差別化ポイント・独自価値）
- Step 2 の `handsonCandidates`（実体験で裏付けられるポイント）
- **内部リンク情報**（任意）: 会話中に `seriesContext` がある場合（呼び出し元スキルが設定）、関連記事情報をアウトライン設計に活用する

### タスク

以下のナラティブ構造をベースに、記事アウトラインを作成してください：

**共感→問題整理→本質解説→具体策→失敗例→結論**

`styleProfile` の見出しパターンとセクション構成を反映してください。

結果として以下を `outline` として保持してください：
- **title**: 記事タイトル（SEO最適化、32文字以内推奨）
- **metaDescription**: メタディスクリプション（120文字以内）
- **sections**: 各セクションの H2見出し・H3見出し・要点
- **illustrationCandidates**: Gemini CLI + Nanobanana で自動生成する図解画像の候補リスト（任意）。抽象概念・フロー・ステップの説明に図解が有効な箇所を特定する。記事の特性上不要な場合は空配列。各候補は以下のフィールドを持つ：
  - `description`: 図解する内容の詳細な説明（Gemini に渡すプロンプトの核になるので具体的に）
  - `altText`: 画像のalt属性テキスト
  - `insertAfter`: どのH2/H3見出しテキストの直後に挿入するか
- **screenshotCandidates**: 自動撮影するスクリーンショット候補のリスト（任意）。記事の特性上不要な場合は空配列。各候補は以下のフィールドを持つ：
  - `type`: `web` or `terminal`
  - `description`: 何を撮るか（`terminal` の場合、表示するコマンドと出力の詳細も含める）
  - `url`: 撮影対象URL（`web` のみ。`primarySources` から取得）
  - `cssSelector`: 特定要素だけ撮影する場合のCSSセレクタ（`web` のみ、任意）
  - `altText`: 画像のalt属性テキスト
  - `insertAfter`: どのH2/H3見出しテキストの直後に挿入するか
  - **重要**: Claude Code のターミナル UI スクリーンショットはモックアップではなくユーザーの実際の画面を使用する。`screenshotCandidates` に含めず、`manualTasks` に `type: cc-screenshot` として配置すること。
- **manualTasks**: ユーザーが手動で実施する必要がある実体験タスクのリスト（任意）。`handsonCandidates` のうち自動撮影では再現できないもの（実際のコマンド実行結果、実データ、利用画面など）。空配列可。各タスク：
  - `type`: `screenshot`（ユーザーがスクリーンショットを撮る）/ `cc-screenshot`（Claude Code ターミナルの実画面スクリーンショット）/ `terminal-output`（コマンド出力テキストを提供→ターミナルモック化）/ `text`（テキスト情報を記事に追記）
  - `description`: 具体的な作業内容（ユーザーへの指示として読めるレベルで詳細に）
  - `purpose`: この情報が記事にとってなぜ重要か
  - `insertAfter`: どのH2/H3見出しの後に挿入するか
  - `altText`: 画像の場合のalt属性テキスト（`text` タイプでは省略可）

---

## Step 6: 記事本文生成 & ファイル書き出し

あなたはプロのWebライターです。

### コンテキスト
- Step 0 の `styleProfile`（文体指示）
- Step 5 の `outline`（構成）
- キーワード: 「{keyword}」

### 文体指示（既存記事スタイルに合わせる）

`styleProfile` の以下を厳守してください：
- 文体（writingStyle）
- 語尾パターン（sentenceEndings）
- トーン（tone）
- 見出しパターン（headingPattern）
- セクション構成（sectionStructure）

### 執筆方針

- **腹落ち・納得**を重視：「なぜそうなるのか」を丁寧に説明
- 抽象的な説明だけでなく、具体例・コード例・数値を交える
- 読者の不安を先回りして解消する
- **表現形式のバリエーション**: 箇条書き・番号付きリスト・テーブル・会話調の散文・Q&A形式など、セクションごとに異なる表現形式を使い分ける。同じパターン（例: 「①太字見出し + 説明文」）が3セクション以上連続しないようにする。対比や比較にはテーブル、理由の列挙には散文、手順にはステップ形式など、内容に最適な形式を選ぶ
- H2/H3タグを適切に使用し、WordPress のブロックエディタと互換性のあるHTMLで出力
- タイトルは本文に含めない（WordPressが自動付与するため）
- **内部リンク**（`seriesContext` がある場合）: 関連記事のうち URL が設定されているものは、本文中の自然な文脈でリンクを挿入する（例: 「詳しいインストール手順は<a href="URL">こちらの記事</a>で解説しています」）。URL が null の記事は「別記事で詳しく解説予定です」のように言及にとどめる。
- **一次情報へのリンク**: Step 2 で収集した `primarySources` を活用し、**公式ページ（一次情報）へのリンク**を本文中に自然に含める。記事の信頼性は一次情報に基づいているかで決まる。以下を意識する：
  - 数値・仕様・手順を述べる箇所では、その根拠となる公式ページにリンクする（「最新の料金は<a href="公式URL">公式料金ページ</a>でご確認ください」など）
  - 記事の冒頭付近と末尾付近に少なくとも1箇所ずつ公式リンクを配置する
  - リンクには `target="_blank" rel="noopener"` を付与する
  - 過剰にリンクを詰め込まない（自然な文脈で3〜6箇所程度）
- **実体験の裏付け**: Step 2 の `handsonCandidates` を活用し、「実際に試した結果」を本文に盛り込む。コマンド実行結果、画面キャプチャ、設定手順の再現など、二次情報の引き写しではなく**自分で確認した事実**が記事の独自価値になる。`screenshotCandidates` と連動させ、実体験を視覚的にも示す。
- **吹き出し（体験談）**: 体験談・一次情報に基づく感想・気づき・注意点は、テーマの吹き出し HTML パーツで表現する。`docs/wp-theme-the-thor.md` の「吹き出し」セクションを Read ツールで読み込み、HTML 構造と使用ルールに従うこと。1記事あたり 2〜4箇所、1〜3文の短いコメントに留める。
- **図解プレースホルダー**: `outline.illustrationCandidates` が空でない場合、各候補の `insertAfter` で指定された見出しセクション内の適切な位置に `<!-- ILLUSTRATION:N -->` コメント（N は 0-indexed）を挿入してください。Step 6.5 で Gemini CLI + Nanobanana による実際の図解画像に置換されます。
- **スクリーンショットプレースホルダー**: `outline.screenshotCandidates` が空でない場合、各候補の `insertAfter` で指定された見出しセクション内の適切な位置に `<!-- SCREENSHOT:N -->` コメント（N は 0-indexed）を挿入してください。Step 6.5 で実際の画像に置換されます。
- **手動タスクプレースホルダー**: `outline.manualTasks` が空でない場合、各タスクの `insertAfter` で指定された見出しセクション内の適切な位置に `<!-- HANDSON:N -->` コメント（N は 0-indexed）を挿入してください。`/incorporate` スキルでユーザーが実体験データを提供した際に置換されます。

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

取得したスラッグの命名パターン（言語・区切り文字・長さ・接尾辞の傾向）を分析し、それに合わせたスラッグを生成してください。

**共通ルール（パターンに関わらず厳守）:**
1. 日本語は使わない（URLエンコードで長くなる・SNSシェア時に壊れるため）
2. 小文字とハイフンのみ使用
3. 短すぎず長すぎず（2〜6語程度）

生成した JSON を `{sessionDir}/article.json` にファイルとして書き出してください（Write ツールを使用）。

---

## Step 6.5: 図解 & スクリーンショット生成 & 挿入（自動）

`outline.illustrationCandidates` と `outline.screenshotCandidates` が両方とも空配列の場合、このステップをスキップしてください。

### 6.5-A. 図解画像の生成（Gemini CLI + Nanobanana）

`outline.illustrationCandidates` が空配列の場合、6.5-A をスキップして 6.5-1 に進んでください。

`gemini` コマンドが利用不可の場合もスキップし、`<!-- ILLUSTRATION:N -->` プレースホルダーを記事 HTML から除去してください。

#### 6.5-A-1. 既存ファイルのチェック

```bash
ls nanobanana-output/ 2>/dev/null || echo "empty"
```

既存ファイルリストを記録してください。

#### 6.5-A-2. 各候補の図解生成

`illustrationCandidates` の各候補（index = N）について順番に実行してください。

1. `description` の内容を分析し、最適な図解タイプを自動選択：
   - **フロー・分岐・構造・関係性** → ダイアグラム指示
   - **手順・チュートリアル・時系列** → 連続画像指示（ステップ数を description から判断、デフォルト 4）
   - **抽象概念・比較・メタファー** → 概念図指示

2. Bash ツールで Gemini CLI を実行（タイムアウト: 180秒）：

   ```bash
   gemini -p "{description に基づいて構築したプロンプト。日本語ラベル、白背景、プロフェッショナルなスタイルを指示}"
   ```

3. 生成されたファイルを特定：

   ```bash
   ls -t nanobanana-output/ | head -10
   ```

4. 生成ファイルをセッションディレクトリにコピー：

   ```bash
   cp nanobanana-output/{新しいファイル} {sessionDir}/screenshots/illustration-{N}.png
   ```

   複数ファイルが生成された場合（ステップ図）は `illustration-{N}-{step}.png` として順番にコピー。

#### 6.5-A-3. WP メディアアップロード & 記事挿入

`isLocal` が true の場合は、`<!-- ILLUSTRATION:N -->` プレースホルダーを記事 HTML から除去し、画像のローカルパスをコンソールに表示して完了。

`isLocal` が false の場合、各図解画像について:

1. WP メディアライブラリにアップロード:

   ```bash
   npx tsx scripts/wp-upload-media.ts "{sessionDir}/screenshots/illustration-{N}.png" "{altText}"
   ```

   出力される JSON から `url` を取得。

2. 記事 HTML 内の `<!-- ILLUSTRATION:N -->` を以下に置換:

   単一画像の場合:
   ```html
   <figure class="wp-block-image"><img src="{url}" alt="{altText}" /><figcaption>{description}</figcaption></figure>
   ```

   複数画像（ステップ図）の場合は、連番の `<figure>` を順番に挿入。

3. すべての置換が完了したら、更新した article.json を Write ツールで `{sessionDir}/article.json` に上書き保存。

### 6.5-1〜4: スクリーンショット生成 & 手動タスク書き出し

`outline.screenshotCandidates` が空配列の場合、スクリーンショット関連のステップをスキップしてください。

Playwright MCP ツールが利用不可の場合もスキップし、`<!-- SCREENSHOT:N -->` プレースホルダーを記事 HTML から除去してください。

### 6.5-1. 撮影準備

```bash
mkdir -p {sessionDir}/screenshots
```

### 6.5-2. 各候補の撮影

`screenshotCandidates` の各候補（index = N）について順番に実行してください。

**type が `web` の場合:**

1. `mcp__playwright__browser_navigate` で `url` を開く
2. `mcp__playwright__browser_wait_for` で読み込み完了を待つ
3. `cssSelector` がある場合は `mcp__playwright__browser_snapshot` で要素の `ref` を特定
4. `mcp__playwright__browser_take_screenshot` で撮影（`cssSelector` 指定時は要素撮影、なければフルページ）
5. 保存先: `{sessionDir}/screenshots/screenshot-{N}.png`

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

### 6.5-3. WP メディアアップロード & 記事挿入

`isLocal` が true の場合は、`<!-- SCREENSHOT:N -->` プレースホルダーを記事 HTML から除去し、撮影したスクリーンショットのローカルパスをコンソールに表示して完了。

`isLocal` が false の場合、各スクリーンショットについて:

1. WP メディアライブラリにアップロード:

   ```bash
   npx tsx scripts/wp-upload-media.ts "{sessionDir}/screenshots/screenshot-{N}.png" "{altText}"
   ```

   出力される JSON から `url` を取得。

2. 記事 HTML 内の `<!-- SCREENSHOT:N -->` を以下に置換:

   ```html
   <figure class="wp-block-image"><img src="{url}" alt="{altText}" /><figcaption>{description}</figcaption></figure>
   ```

3. すべての置換が完了したら、更新した article.json を Write ツールで `{sessionDir}/article.json` に上書き保存。

### 6.5-4. 手動タスクの書き出し

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

`wpPostId` は Step 9 で WP 投稿後に判明するため、ここでは null とします。

さらに、ユーザーが作業内容を把握できるよう `{sessionDir}/handson-tasks.md` も Write ツールで書き出してください：

```markdown
# 手動タスク: 「{article.title}」

記事の品質を高めるため、以下の実体験データの収集をお願いします。
収集後、`/incorporate {sessionDir}` で記事に反映できます。

---

## タスク 1: {description}

- **種類**: スクリーンショット / コマンド出力 / テキスト
- **目的**: {purpose}
- **挿入先**: 「{insertAfter}」セクション

### 作業手順

{description をもとに、具体的な手順を箇条書きで記載}

---

（以降、タスクごとに繰り返し）
```

書き出し後、コンソールに以下を表示してください：

```
手動タスク: {件数}件
  作業内容: {sessionDir}/handson-tasks.md
  機械読取用: {sessionDir}/handson-tasks.json
実施後に /incorporate {sessionDir} で記事に反映できます。
```

---

## Step 7: 記事レビュー

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

## Step 8: ファクトチェック

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

## Step 9: PR 作成（オプション）

`isLocal` が true の場合は、このステップをスキップしてください。
`{sessionDir}/article.json` の保存のみで完了です。

`isLocal` が false の場合は、以下の手順で PR を作成してください。

### 9-1. ブランチ作成

```bash
git checkout -b article/{domain}/{slug}
```

### 9-2. ファイル配置

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

### 9-3. WP 下書き投稿（プレビュー用）

記事を WordPress に下書き投稿して、プレビュー URL を取得します：

```bash
npx tsx scripts/wp-publish-draft.ts "articles/{domain}/{slug}/article.json"
```

出力から `Post ID` を取得し、以下を実行してください：

1. `articles/{domain}/{slug}/article.json` に `"wpPostId": {postId}` フィールドを追加（Edit ツール使用）
2. プレビュー URL を `previewUrl` として保持：`{WP_SITE_URL}/?p={postId}&preview=true`
3. 編集 URL を `editUrl` として保持：`{WP_SITE_URL}/wp-admin/post.php?post={postId}&action=edit`

### 9-4. コミット & プッシュ

```bash
git add articles/{domain}/{slug}/
git commit -m "feat: add article '{title}'"
git push -u origin article/{domain}/{slug}
```

### 9-5. PR 作成

`gh pr create` で PR を作成してください。PR body は以下のテンプレートで生成：

```
gh pr create --title "article: {title}" --body "$(cat <<'PREOF'
## {title}

**Keyword**: {keyword}
**Slug**: {slug}
**Meta Description**: {metaDescription}
**Tags**: {tags をカンマ区切り}

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

Manual tasks can be completed by committing to this branch:
- Screenshots: add to `articles/{domain}/{slug}/screenshots/`
- Text data: comment on this PR

{manualTasks に cc-screenshot タイプがある場合のみ以下のセクションを出力}
### Claude Code スクリーンショット撮影ガイド

この記事には Claude Code の実画面スクリーンショットが必要です。

#### セットアップ
1. Claude Code を該当プロジェクトのディレクトリで起動
2. ターミナルの幅を **100〜120 文字**程度に調整（記事画像として見やすいサイズ）
3. フォントサイズは通常〜やや大きめを推奨

#### 撮影方法
1. 記事で説明している操作を実際に実行
2. 撮影したい画面が表示されたらスクリーンショットを撮影
   - macOS: `Cmd+Shift+4` → スペース → ウィンドウクリック
   - 影なし: `Option` を押しながらクリック
3. 不要な前後の行が多い場合はトリミング

#### 検証チェックリスト
- [ ] 画像が鮮明で文字が読める
- [ ] 記事の説明と画面の内容が一致している
- [ ] 個人情報・機密情報（フルパス、API キー、トークン等）が映り込んでいない
- [ ] 画像の幅が 800px 以上ある

#### 提出方法
```bash
git checkout article/{domain}/{slug}
cp ~/path/to/screenshot.png articles/{domain}/{slug}/screenshots/{filename}.png
git add articles/{domain}/{slug}/screenshots/
git commit -m "add: Claude Code screenshot"
git push
```

---

### Review Checklist
- [ ] 事実関係に誤りがないか
- [ ] 読者にとって分かりやすいか
- [ ] 文体がサイトのトーンに合っているか
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
- 手動タスクがある場合: 件数と PR 上での作業手順
