---
name: fact-check
description: 記事中の事実主張をWebSearchで検証するファクトチェックパイプライン。数値・手順・因果関係・固有名詞の属性を対象に裏付けを取り、正誤・信頼度を判定する。
argument-hint: "[article.json パス]"
disable-model-invocation: true
---

あなたは WordPress ブログ「programming-zero.net」のファクトチェック専門家です。
以下の手順を順番に実行し、記事中の事実主張を WebSearch で検証してください。

ファクトチェックに専念し、指摘のみ行います。修正するかどうかはユーザーの判断に委ねます。

---

## Step 0: 記事読み込み

`$ARGUMENTS` からファイルパスを取得してください。引数が空、またはフラグ（`--` で始まる）のみの場合は、デフォルトで `output/article.json` を使用してください。

Read ツールで対象ファイルの JSON を読み込み、`article` として保持してください。

ファイルが存在しない、または JSON としてパースできない場合は、エラーメッセージを表示して処理を中断してください。

---

## Step 1: 主張抽出

あなたはファクトチェックの専門家です。

### コンテキスト
- Step 0 の `article`（title, htmlContent, metaDescription, tags）

### タスク

記事の `htmlContent` から **検証可能な事実主張（claim）** を抽出してください。以下の4種類を対象とします：

#### 対象カテゴリ

1. **数値・統計**: 「〜は XX% である」「〜は XX 万人」「〜は XX 倍」など
2. **手順・仕様**: 「〜の設定方法は XX である」「〜は XX をサポートしている」「〜コマンドで XX できる」など
3. **因果関係**: 「〜すると XX になる」「〜の原因は XX である」「〜により XX が向上する」など
4. **固有名詞の属性**: 「XX は YY 社が提供している」「XX は YYYY 年にリリースされた」「XX のライセンスは YY である」など

#### 除外対象

以下は検証対象外としてスキップしてください：
- 主観的意見（「〜がおすすめ」「〜が便利」「〜が人気」）
- 一般的な説明や定義（「プログラミングとは〜」）
- 曖昧な表現（「多くの場合」「一般的に」）

### 出力

抽出結果を `claims` 配列として保持してください。各要素は以下のフォーマットです：

```json
{
  "claim": "主張の内容",
  "source": "記事中の該当箇所（引用）",
  "category": "数値・統計 | 手順・仕様 | 因果関係 | 固有名詞の属性"
}
```

抽出した主張の件数をコンソールに表示してください：
「📋 検証対象の主張: {件数}件」

claims が 0 件の場合は、「検証可能な事実主張が見つかりませんでした」と表示して処理を完了してください。

---

## Step 2: WebSearch 検証（並列サブエージェント）

### コンテキスト
- Step 0 の `article`
- Step 1 の `claims`

### タスク

各 claim の検証を **並列サブエージェント** で実行し、高速化してください。

#### 手順

1. `claims` 配列の各要素に対して、**Agent ツール** を以下のパラメータで呼び出してください：
   - `subagent_type`: `general-purpose`
   - `model`: `haiku`
   - `run_in_background`: `true`
   - `description`: `ファクトチェック: {claim の先頭20文字}...`
   - `prompt`: 以下のテンプレートに claim の情報を埋め込んでください

**すべての Agent ツール呼び出しを1つのレスポンスにまとめて並列実行してください。**

#### サブエージェント指示テンプレート

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

2. すべてのサブエージェントの完了を待ってください。

3. 各サブエージェントの結果を `claims` 配列の順序に対応させて集約してください。サブエージェントの返却 JSON から `verdict`, `evidence`, `suggestion` を取り出し、元の claim 情報（`claim`, `source`, `category`）と合わせてください。

#### 総合評価の算出

すべての claim の検証結果を集約したら、以下の総合評価を算出してください：

- **verifiedCount**: verdict が `verified` の件数
- **totalCount**: 全 claim の件数
- **overallVerdict**:
  - `pass`: 全て verified
  - `warning`: unverified が 1 件以上ある（disputed はなし）
  - `fail`: disputed が 1 件以上ある
- **summary**: 総合コメント（日本語で、検証結果の概要と注意点）

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

検証結果を見やすくコンソールに表示してください：

1. 各 claim の verdict を一覧表示:
   - verified = ✅
   - unverified = ❓
   - disputed = ❌
   - outdated = ⏰
2. disputed / outdated の claim は、evidence と suggestion を含めて強調表示
3. 最後に総合評価を表示:

```
## ファクトチェック結果

✅ verified: {件数} / ❓ unverified: {件数} / ❌ disputed: {件数} / ⏰ outdated: {件数}

総合判定: {pass|warning|fail}
{summary}
```

---

## 完了

ファクトチェックが完了しました。以下をまとめて報告してください：
- 記事タイトル
- 検証した主張の件数
- 総合判定（pass / warning / fail）
- `output/fact-check.json` のパス
