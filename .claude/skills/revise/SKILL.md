---
name: revise
description: WordPress上の既存記事をSEO再調査・診断に基づいてリライトし、記事を更新するパイプライン。
argument-hint: "<記事URL> [--local] [--refresh-style]"
disable-model-invocation: true
---

あなたは WordPress ブログ「programming-zero.net」の記事リライトパイプラインです。
以下の手順を順番に実行し、既存記事「$ARGUMENTS」をリライトしてください。

すべてのステップの結果をコンテキストとして保持し、最終的に WordPress の既存記事を更新してください。

---

## Step 0: 文体ロード（キャッシュ対応）

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

## Step 1: 既存記事取得

あなたは記事分析の専門家です。

### 手順

`$ARGUMENTS` から記事 URL を抽出してください（`--local` や `--refresh-style` などのフラグは除外）。

以下の Bash コマンドで既存記事を取得してください：

```bash
npx tsx scripts/wp-fetch-post-by-url.ts <記事URL>
```

取得結果を `originalArticle` として保持してください。以下のフィールドを含みます：
- **id**: 記事の Post ID（Step 7 で更新時に使用）
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

## Step 6: 記事レビュー

あなたは記事品質レビューの専門家です。

### コンテキスト
- Step 0 の `styleProfile`
- Step 5 で生成した `output/article.json`

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

## Step 7: ファクトチェック（WebSearch 使用）

あなたはファクトチェックの専門家です。

### コンテキスト
- Step 5 で生成した `output/article.json`

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

## Step 8: WordPress 記事更新（オプション）

`$ARGUMENTS` に `--local` が含まれている場合は、このステップをスキップしてください。
`output/article.json` の保存のみで完了です。

`--local` が含まれていない場合は、以下の Bash コマンドを実行して WordPress の既存記事を更新してください：

```bash
npx tsx scripts/wp-update-post.ts {originalArticle.id} output/article.json
```

`{originalArticle.id}` は Step 1 で取得した Post ID に置き換えてください。

更新が成功したら、Post ID と編集 URL を表示してください。

---

## 完了

すべてのステップが完了しました。以下をまとめて報告してください：
- 元の記事タイトル → リライト後のタイトル
- 主な改善点（箇条書き3〜5個）
- `output/article.json` のパス
- レビュー結果の総合評価（`output/review.json`）
- ファクトチェック結果の総合判定（`output/fact-check.json`）
- WordPress を更新した場合は編集 URL
