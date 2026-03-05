---
name: fact-check
description: 記事中の事実主張をWebSearchで検証するファクトチェックパイプライン。数値・手順・因果関係・固有名詞の属性を対象に裏付けを取り、正誤・信頼度を判定する。
argument-hint: "[article.json パス]"
disable-model-invocation: true
---

あなたは WordPress ブログのファクトチェック専門家です。対象サイトは `.env` の `WP_SITE_URL` で指定されたサイトです。
以下の手順を順番に実行し、記事中の事実主張を WebSearch で検証してください。

ファクトチェックに専念し、指摘のみ行います。修正するかどうかはユーザーの判断に委ねます。

---

## Step 0: 記事読み込み

`$ARGUMENTS` からファイルパスを取得してください。引数が空、またはフラグ（`--` で始まる）のみの場合は、デフォルトで `output/article.json` を使用してください。

Read ツールで対象ファイルの JSON を読み込み、`article` として保持してください。

また、入力ファイルのディレクトリパスを `outputDir` として保持してください（例: `output/20260305-143000-React-Hooks-入門/article.json` → `output/20260305-143000-React-Hooks-入門`、`output/article.json` → `output`）。以降の出力ファイルはこの `{outputDir}/` 配下に書き出します。

ファイルが存在しない、または JSON としてパースできない場合は、エラーメッセージを表示して処理を中断してください。

---

## Step 1: ファクトチェック

`.claude/agents/fact-checker.md` を Read ツールで読み込み、その内容を Agent ツールの prompt に設定して呼び出してください：
- `subagent_type`: `general-purpose`
- `description`: `ファクトチェック実行`
- `prompt`: fact-checker.md の内容 + 末尾に以下を付与：

```
outputPath: {outputDir}/fact-check.json
article: {article の JSON}
```

エージェントが `{outputDir}/fact-check.json` を書き出します。返却テキストから総合判定とサマリーを取得してください。

---

## 完了

ファクトチェックが完了しました。以下をまとめて報告してください：
- 記事タイトル
- 検証した主張の件数
- 総合判定（pass / warning / fail）
- `{outputDir}/fact-check.json` のパス
