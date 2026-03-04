---
name: generate
description: SEO最適化された日本語ブログ記事を9ステップで生成し、WordPressに下書き投稿する記事生成パイプライン。
argument-hint: "<キーワード> [--local] [--refresh-style]"
disable-model-invocation: true
---

あなたは WordPress ブログ「programming-zero.net」の記事生成パイプラインです。
以下の手順を順番に実行し、キーワード「$ARGUMENTS」に基づいて高品質な記事を生成してください。

すべてのステップの結果をコンテキストとして保持し、最終的に WordPress に下書き投稿してください。

---

## Step 0: 文体分析（キャッシュ対応）

あなたは文体分析の専門家です。

このステップでは、既存記事の文体を分析して `styleProfile` を取得します。
分析結果はドメインごとにキャッシュされ、2回目以降は再利用されます。

### 手順

1. `.env` の `WP_SITE_URL` からドメインを取得してください（例: `https://programming-zero.net` → `programming-zero.net`）。以下の Bash コマンドで取得できます：

```bash
grep WP_SITE_URL .env | sed 's|.*://||' | sed 's|/.*||'
```

2. `$ARGUMENTS` に `--refresh-style` が含まれている場合は **手順 4（キャッシュなし）** に進んでください。

3. **キャッシュ確認**: `cache/style-profiles/{domain}.json` を Read ツールで読み込んでください。
   - **ファイルが存在しない場合（キャッシュミス）**: 手順 4 に進んでください。
   - **ファイルが存在する場合**: `cachedAt` の日時と現在日時を比較してください。
     - **30日以上経過** → 「⏰ 文体キャッシュが {経過日数}日前のため、自動で再分析します」と表示し、**手順 4** に進んでください。
     - **30日未満** → 「✅ 文体キャッシュを使用（{経過日数}日前に分析）」と表示し、JSON の `styleProfile` フィールドを `styleProfile` として保持して **Step 1 に進んでください**（記事取得・分析をスキップ）。

4. **キャッシュなし（新規分析）**:

   a. WordPress から直近5件の既存記事を取得します：

   ```bash
   npx tsx scripts/wp-fetch-posts.ts 5
   ```

   b. 取得した記事の文体・スタイルを以下の観点で分析してください：

   - **writingStyle**: 文体の全体的な特徴（説明的か会話的か、簡潔か詳細か、など）
   - **sentenceEndings**: よく使われる語尾パターン（3〜5個）
   - **tone**: 敬体/常体の判定と、トーンの特徴（親しみやすさ、専門性など）
   - **headingPattern**: H2/H3見出しの使い方パターン（命名規則、粒度など）
   - **sectionStructure**: セクション構成の傾向（導入→本題→まとめ、など）

   c. 分析結果を以下のフォーマットで `cache/style-profiles/{domain}.json` に Write ツールで書き出してください：

   ```json
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
   ```

   d. `styleProfile` を保持してください。

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

## Step 7: 記事レビュー

あなたは記事品質レビューの専門家です。

### コンテキスト
- Step 0 の `styleProfile`
- Step 6 で生成した `output/article.json`

### タスク

`output/article.json` を Read ツールで読み込み、以下の **5カテゴリ** でレビューしてください。

#### 1. SEO
- タイトル長（32文字以内推奨）
- メタディスクリプション（120文字以内）
- 見出し構造（H2/H3 の階層が適切か）
- キーワードの自然な配置

#### 2. 構成（structure）
- 導入→本題→まとめの論理フロー
- セクション間の繋がり
- 冗長箇所
- 情報の過不足

#### 3. 可読性（readability）
- 一文・段落の長さ
- 専門用語への説明
- 読者にとってのわかりやすさ

#### 4. 文体一貫性（styleConsistency）
- `styleProfile` との整合（語尾パターン、トーン、見出しパターン）

#### 5. 正確性（accuracy）
- 事実関係の疑わしい記述
- 古くなりそうな情報
- 誤解を招く表現

### 各カテゴリの出力フォーマット

- **score**: A / B / C の3段階（A=問題なし、B=軽微な改善余地、C=要改善）
- **findings**: 具体的な指摘事項の配列（箇所の引用 + 改善提案）

### 総合評価

すべてのカテゴリの評価を踏まえて、**overallScore**（A / B / C）と **summary**（総合的なレビューコメント）を出力してください。

### 出力

結果を以下の JSON フォーマットで `output/review.json` に Write ツールで書き出してください：

```json
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
```

### コンソール表示

レビュー結果を見やすくコンソールに表示してください：

1. 各カテゴリのスコアを一覧表示（A=✅、B=⚠️、C=❌）
2. C評価のカテゴリがあれば、該当する指摘を強調表示
3. 総合評価とサマリーを最後に表示

---

## Step 8: ファクトチェック（WebSearch 使用）

あなたはファクトチェックの専門家です。

### コンテキスト
- Step 6 で生成した `output/article.json`

### タスク

`output/article.json` を Read ツールで読み込み、記事中の **検証可能な事実主張（claim）** を抽出して WebSearch で検証してください。

#### 主張抽出

`htmlContent` から以下の4種類の事実主張を抽出してください：

1. **数値・統計**: 「〜は XX% である」「〜は XX 万人」など
2. **手順・仕様**: 「〜の設定方法は XX である」「〜は XX をサポートしている」など
3. **因果関係**: 「〜すると XX になる」「〜の原因は XX である」など
4. **固有名詞の属性**: 「XX は YY 社が提供している」「XX は YYYY 年にリリースされた」など

主観的意見（「〜がおすすめ」「〜が便利」）は除外してください。

#### WebSearch 検証

各 claim に対して WebSearch ツールで検索し、以下の verdict を判定してください：

- **verified**: 信頼できる情報源で裏付けが取れた
- **unverified**: 裏付けとなる情報が見つからなかった
- **disputed**: 矛盾する情報が見つかった
- **outdated**: 現在は古い情報の可能性がある

#### 総合評価

- **overallVerdict**: `pass`（全て verified）/ `warning`（unverified あり）/ `fail`（disputed あり）

### 出力

結果を以下の JSON フォーマットで `output/fact-check.json` に Write ツールで書き出してください：

```json
{
  "checkedAt": "ISO 8601形式の現在日時",
  "articleTitle": "記事タイトル",
  "claims": [
    {
      "claim": "主張の内容",
      "source": "記事中の該当箇所",
      "category": "数値・統計 | 手順・仕様 | 因果関係 | 固有名詞の属性",
      "verdict": "verified | unverified | disputed | outdated",
      "evidence": "検証の根拠",
      "suggestion": "修正提案（該当時のみ、それ以外は null）"
    }
  ],
  "verifiedCount": 0,
  "totalCount": 0,
  "overallVerdict": "pass | warning | fail",
  "summary": "総合コメント"
}
```

### コンソール表示

- 各 claim の verdict を一覧表示（verified=✅、unverified=❓、disputed=❌、outdated=⏰）
- disputed / outdated の claim は evidence と suggestion を含めて強調表示
- `fail`（disputed あり）の場合は該当箇所を強調表示
- 総合評価とサマリーを最後に表示

---

## Step 9: WordPress 下書き投稿（オプション）

`$ARGUMENTS` に `--local` が含まれている場合は、このステップをスキップしてください。
`output/article.json` の保存のみで完了です。

`--local` が含まれていない場合は、以下の Bash コマンドを実行して WordPress に下書き投稿してください：

```bash
npx tsx scripts/wp-publish-draft.ts output/article.json
```

投稿が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

すべてのステップが完了しました。以下をまとめて報告してください：
- 記事タイトル
- `output/article.json` のパス
- レビュー結果の総合評価（`output/review.json`）
- ファクトチェック結果の総合判定（`output/fact-check.json`）
- WordPress に投稿した場合は編集 URL
