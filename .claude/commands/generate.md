あなたは WordPress ブログ「programming-zero.net」の記事生成パイプラインです。
以下の手順を順番に実行し、キーワード「$ARGUMENTS」に基づいて高品質な記事を生成してください。

すべてのステップの結果をコンテキストとして保持し、最終的に WordPress に下書き投稿してください。

---

## 準備: 既存記事の取得

まず、WordPress から直近5件の既存記事を取得します。以下の Bash コマンドを実行してください：

```bash
npx tsx scripts/wp-fetch-posts.ts 5
```

取得した JSON を `existingArticles` として保持してください。

---

## Step 0: 文体分析

あなたは文体分析の専門家です。

上記で取得した既存記事（`existingArticles`）の文体・スタイルを分析してください。

### 分析項目

以下の観点で分析してください：

1. **writingStyle**: 文体の全体的な特徴（説明的か会話的か、簡潔か詳細か、など）
2. **sentenceEndings**: よく使われる語尾パターン（3〜5個）
3. **tone**: 敬体/常体の判定と、トーンの特徴（親しみやすさ、専門性など）
4. **headingPattern**: H2/H3見出しの使い方パターン（命名規則、粒度など）
5. **sectionStructure**: セクション構成の傾向（導入→本題→まとめ、など）

結果を `styleProfile` として保持してください。

---

## Step 1: キーワード分析

あなたはSEO戦略の専門家です。

キーワード「$ARGUMENTS」について、検索意図を3段階の仮説で言語化してください。

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
- キーワード: 「$ARGUMENTS」
- Step 1 で得た表層意図・潜在意図・最終ゴール

### タスク

Step 1 で生成した `searchQueries` を使って **WebSearch ツールで実際に検索** してください。

検索結果をもとに以下を分析：

1. **topArticles**: 上位記事（最大10件）のURL・タイトル・要約を収集
2. **commonStructure**: 上位記事に共通する構造パターンを抽出
3. **mustCoverTopics**: 上位記事が共通してカバーしている必須トピックを特定
4. **gapOpportunities**: 上位記事に不足している点（差別化の機会）を特定

結果を `seoAnalysis` として保持してください。

---

## Step 3: 意図深掘り

あなたはユーザー心理の専門家です。

### コンテキスト
- Step 1 の `keywordAnalysis` 全体
- Step 2 の `seoAnalysis`（共通構造・必須トピック・差別化機会）

### タスク

キーワード「$ARGUMENTS」で検索する読者について、以下を深掘りして言語化してください：

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

### タスク

以下のナラティブ構造をベースに、記事アウトラインを作成してください：

**共感→問題整理→本質解説→具体策→失敗例→結論**

`styleProfile` の見出しパターンとセクション構成を反映してください。

結果として以下を `outline` として保持してください：
- **title**: 記事タイトル（SEO最適化、32文字以内推奨）
- **metaDescription**: メタディスクリプション（120文字以内）
- **sections**: 各セクションの H2見出し・H3見出し・要点

---

## Step 6: 記事本文生成 & ファイル書き出し

あなたはプロのWebライターです。

### コンテキスト
- Step 0 の `styleProfile`（文体指示）
- Step 5 の `outline`（構成）
- キーワード: 「$ARGUMENTS」

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
- H2/H3タグを適切に使用し、WordPress のブロックエディタと互換性のあるHTMLで出力
- タイトルは本文に含めない（WordPressが自動付与するため）

### 出力

以下の JSON を生成してください：

```json
{
  "title": "記事タイトル",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2", "タグ3"]
}
```

生成した JSON を `output/article.json` にファイルとして書き出してください（Write ツールを使用）。

---

## Step 7: WordPress 下書き投稿

最後に、以下の Bash コマンドを実行して WordPress に下書き投稿してください：

```bash
npx tsx scripts/wp-publish-draft.ts output/article.json
```

投稿が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

すべてのステップが完了しました。生成した記事のタイトルと WordPress の編集 URL をまとめて報告してください。
