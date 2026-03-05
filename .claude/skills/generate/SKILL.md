---
name: generate
description: SEO最適化された日本語ブログ記事を9ステップで生成し、WordPressに下書き投稿する記事生成パイプライン。
argument-hint: "<キーワード> [--local] [--refresh-style]"
disable-model-invocation: true
---

あなたは WordPress ブログの記事生成パイプラインです。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。
以下の手順を順番に実行し、キーワード「$ARGUMENTS」に基づいて高品質な記事を生成してください。

すべてのステップの結果をコンテキストとして保持し、最終的に WordPress に下書き投稿してください。

---

## セッションディレクトリの作成

複数セッションの同時実行でファイルが競合しないよう、セッション固有の出力ディレクトリを使用します。

### 手順

1. `$ARGUMENTS` からキーワード部分を抽出してください（`--local`, `--refresh-style` などのフラグは除外）。
2. キーワードのスペースをハイフンに置換して `slug` を生成してください（例: 「React Hooks 入門」→「React-Hooks-入門」）。
3. 以下の Bash コマンドでセッションディレクトリを作成してください（`<slug>` は手順 2 の値に置換）：

```bash
SESSION_DIR="output/$(date +%Y%m%d-%H%M%S)-<slug>"
mkdir -p "$SESSION_DIR"
echo "$SESSION_DIR"
```

4. 出力されたパスを `sessionDir` として保持してください（例: `output/20260305-143000-React-Hooks-入門`）。

以降、すべての出力ファイルは `{sessionDir}/` 配下に書き出します。

---

## Step 0: 文体分析（キャッシュ対応）

あなたは文体分析の専門家です。

このステップでは、既存記事の文体を分析して `styleProfile` を取得します。
分析結果はドメインごとにキャッシュされ、2回目以降は再利用されます。

### 手順

1. `.env` の `WP_SITE_URL` からドメインを取得してください（例: `https://example.com` → `example.com`）。以下の Bash コマンドで取得できます：

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

生成した JSON を `{sessionDir}/article.json` にファイルとして書き出してください（Write ツールを使用）。

---

## Step 7: 記事レビュー（並列サブエージェント）

### コンテキスト
- Step 0 の `styleProfile`
- Step 6 で生成した `{sessionDir}/article.json`

### タスク

`{sessionDir}/article.json` を Read ツールで読み込み、5カテゴリのレビューを **並列サブエージェント** で実行してください。

#### 手順

1. `{sessionDir}/article.json` を Read ツールで読み込んで `article` として保持してください。

2. 以下の **5つの Agent ツール呼び出し** を **1つのレスポンスにまとめて並列実行** してください。各エージェントのパラメータ：
   - `subagent_type`: `general-purpose`
   - `model`: `haiku`
   - `run_in_background`: `true`

#### サブエージェント一覧

**エージェント 1: SEO レビュー**
- `description`: `レビュー: SEO`
- `prompt`:

```
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
```

**エージェント 2: 構成（structure）レビュー**
- `description`: `レビュー: 構成`
- `prompt`:

```
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
```

**エージェント 3: 可読性（readability）レビュー**
- `description`: `レビュー: 可読性`
- `prompt`:

```
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
```

**エージェント 4: 文体一貫性（styleConsistency）レビュー**
- `description`: `レビュー: 文体一貫性`
- `prompt`:

```
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
```

**エージェント 5: 正確性（accuracy）レビュー**
- `description`: `レビュー: 正確性`
- `prompt`:

```
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
```

3. すべてのサブエージェントの完了を待ってください。

4. 各サブエージェントの結果 JSON を対応するカテゴリキー（`seo`, `structure`, `readability`, `styleConsistency`, `accuracy`）にマッピングしてください。

#### 総合評価の算出

5カテゴリの結果を集約し、以下を算出してください：
- **overallScore**: 全カテゴリの最低スコアを採用（C が1つでもあれば C、B が1つでもあれば B、全て A なら A）
- **summary**: 総合的なレビューコメント（日本語で、各カテゴリの結果を踏まえた総括）

### 出力

結果を以下の JSON フォーマットで `{sessionDir}/review.json` に Write ツールで書き出してください：

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

## Step 8: ファクトチェック（並列サブエージェント）

### コンテキスト
- Step 6 で生成した `{sessionDir}/article.json`

### タスク

記事中の事実主張を抽出し、**並列サブエージェント** で WebSearch 検証してください。

#### 8-1. 主張抽出

`{sessionDir}/article.json` を Read ツールで読み込み（Step 7 で既に読み込んでいる場合は再利用）、`htmlContent` から以下の4種類の **検証可能な事実主張（claim）** を抽出してください：

1. **数値・統計**: 「〜は XX% である」「〜は XX 万人」など
2. **手順・仕様**: 「〜の設定方法は XX である」「〜は XX をサポートしている」など
3. **因果関係**: 「〜すると XX になる」「〜の原因は XX である」など
4. **固有名詞の属性**: 「XX は YY 社が提供している」「XX は YYYY 年にリリースされた」など

主観的意見（「〜がおすすめ」「〜が便利」）は除外してください。

抽出した主張の件数をコンソールに表示してください：「📋 検証対象の主張: {件数}件」

claims が 0 件の場合は、空の fact-check.json を書き出して Step 9 に進んでください。

#### 8-2. 並列 WebSearch 検証

`claims` 配列の各要素に対して、**Agent ツール** を以下のパラメータで呼び出してください：
- `subagent_type`: `general-purpose`
- `model`: `haiku`
- `run_in_background`: `true`
- `description`: `ファクトチェック: {claim の先頭20文字}...`

**すべての Agent ツール呼び出しを1つのレスポンスにまとめて並列実行してください。**

サブエージェント指示テンプレート:

```
あなたはファクトチェッカーです。以下の主張を WebSearch で検証してください。

主張: {claim.claim}
記事中の該当箇所: {claim.source}
カテゴリ: {claim.category}

検証手順:
1. この主張を検証するための検索クエリを生成してください（日本語・英語の両方で検索すると精度が上がります）
2. WebSearch ツールで検索してください
3. 検索結果から以下を判定してください:
   - verdict: verified（信頼できる情報源で裏付けが取れた）/ unverified（裏付けが見つからない）/ disputed（矛盾する情報あり）/ outdated（古い情報の可能性）
   - evidence: 検証の根拠（情報源と要約）
   - suggestion: disputed/outdated の場合のみ修正提案（それ以外は null）

結果を以下の JSON のみで返してください（他のテキストは不要）:
{"verdict": "...", "evidence": "...", "suggestion": "..."}
```

#### 8-3. 結果集約

すべてのサブエージェントの完了を待ち、結果を `claims` 配列の順序に対応させて集約してください。

総合評価を算出:
- **overallVerdict**: `pass`（全て verified）/ `warning`（unverified あり）/ `fail`（disputed あり）

### 出力

結果を以下の JSON フォーマットで `{sessionDir}/fact-check.json` に Write ツールで書き出してください：

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
`{sessionDir}/article.json` の保存のみで完了です。

`--local` が含まれていない場合は、以下の Bash コマンドを実行して WordPress に下書き投稿してください：

```bash
npx tsx scripts/wp-publish-draft.ts {sessionDir}/article.json
```

投稿が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

すべてのステップが完了しました。以下をまとめて報告してください：
- 記事タイトル
- `{sessionDir}/article.json` のパス
- レビュー結果の総合評価（`{sessionDir}/review.json`）
- ファクトチェック結果の総合判定（`{sessionDir}/fact-check.json`）
- WordPress に投稿した場合は編集 URL
