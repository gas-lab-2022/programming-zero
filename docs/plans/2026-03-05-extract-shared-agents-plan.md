# 共通ロジックのエージェント抽出 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** スキル間で重複している文体ロード・レビュー・ファクトチェックのロジックを `.claude/agents/` に切り出し、スキルを薄いオーケストレーターにする。

**Architecture:** 3つの再利用可能エージェント (style-loader, article-reviewer, fact-checker) を作成。各スキルはエージェントの prompt ファイルを Read → コンテキスト付与 → Agent ツールで呼び出す構成に変更。

**Tech Stack:** Claude Code Skills/Agents (Markdown prompt files)

---

## Task 1: style-loader エージェント作成

**Files:**
- Create: `.claude/agents/style-loader.md`

**Step 1: エージェントファイル作成**

`.claude/agents/style-loader.md` を以下の内容で作成:

```markdown
あなたは文体分析の専門家です。

WordPress サイトの既存記事から文体を分析し、`styleProfile` を JSON で返してください。
分析結果はドメインごとにキャッシュされ、2回目以降は再利用されます。

## 入力

このプロンプトの末尾に以下が付与されます：
- `refreshStyle`: true または false

## 手順

1. `.env` の `WP_SITE_URL` からドメインを取得してください：

\`\`\`bash
grep WP_SITE_URL .env | sed 's|.*://||' | sed 's|/.*||'
\`\`\`

2. `refreshStyle` が `true` の場合は **手順 4** に進んでください。

3. **キャッシュ確認**: `cache/style-profiles/{domain}.json` を Read ツールで読み込んでください。
   - **ファイルが存在しない場合**: 手順 4 に進んでください。
   - **ファイルが存在する場合**: `cachedAt` の日時と現在日時を比較してください。
     - **30日以上経過** → 「⏰ 文体キャッシュが {経過日数}日前のため、自動で再分析します」と表示し、**手順 4** に進んでください。
     - **30日未満** → 「✅ 文体キャッシュを使用（{経過日数}日前に分析）」と表示し、JSON の `styleProfile` フィールドの内容をそのまま **最終出力** として返してください。

4. **キャッシュなし（新規分析）**:

   a. WordPress から直近5件の既存記事を取得します：

   \`\`\`bash
   npx tsx scripts/wp-fetch-posts.ts 5
   \`\`\`

   b. 取得した記事の文体・スタイルを以下の観点で分析してください：

   - **writingStyle**: 文体の全体的な特徴（説明的か会話的か、簡潔か詳細か、など）
   - **sentenceEndings**: よく使われる語尾パターン（3〜5個）
   - **tone**: 敬体/常体の判定と、トーンの特徴（親しみやすさ、専門性など）
   - **headingPattern**: H2/H3見出しの使い方パターン（命名規則、粒度など）
   - **sectionStructure**: セクション構成の傾向（導入→本題→まとめ、など）

   c. 分析結果を以下のフォーマットで `cache/style-profiles/{domain}.json` に Write ツールで書き出してください：

   \`\`\`json
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
   \`\`\`

## 最終出力

`styleProfile` オブジェクトの JSON **のみ** を出力してください（説明や他のテキストは不要）：

\`\`\`json
{
  "writingStyle": "...",
  "sentenceEndings": ["...", "..."],
  "tone": "...",
  "headingPattern": "...",
  "sectionStructure": "..."
}
\`\`\`
```

**Step 2: コミット**

```bash
git add .claude/agents/style-loader.md
git commit -m "feat: add style-loader agent for reusable style profile loading"
```

---

## Task 2: article-reviewer エージェント作成

**Files:**
- Create: `.claude/agents/article-reviewer.md`

**Step 1: エージェントファイル作成**

`.claude/agents/article-reviewer.md` を以下の内容で作成。
現在 `generate/SKILL.md` の Step 7 (行 251-424) にあるレビューロジックを移植する。

内容の要点：
- 入力: `outputPath`（review.json の書出先）、`styleProfile` JSON、`article` JSON がプロンプト末尾に付与される
- 5つの haiku サブエージェントを並列起動（SEO, 構成, 可読性, 文体一貫性, 正確性）
- 各サブエージェントの prompt テンプレートは現在の generate/SKILL.md Step 7 からそのまま移植
- 結果集約: overallScore（最低スコア採用）、summary 算出
- `{outputPath}` に review.json を Write ツールで書き出し
- コンソール表示: 各カテゴリスコア + 総合評価
- 最終出力: overallScore と summary をテキストで返す

**ソース**: `.claude/skills/generate/SKILL.md` の行 251〜424 をベースに、入力セクションを追加し、自己完結するエージェント定義にする。

**Step 2: コミット**

```bash
git add .claude/agents/article-reviewer.md
git commit -m "feat: add article-reviewer agent for reusable 5-category review"
```

---

## Task 3: fact-checker エージェント作成

**Files:**
- Create: `.claude/agents/fact-checker.md`

**Step 1: エージェントファイル作成**

`.claude/agents/fact-checker.md` を以下の内容で作成。
現在 `generate/SKILL.md` の Step 8 (行 426-519) にあるファクトチェックロジックを移植する。

内容の要点：
- 入力: `outputPath`（fact-check.json の書出先）、`article` JSON がプロンプト末尾に付与される
- 主張抽出（4カテゴリ: 数値・統計、手順・仕様、因果関係、固有名詞の属性）
- N 個の haiku サブエージェントを並列起動（各 claim を WebSearch 検証）
- 結果集約: overallVerdict（pass/warning/fail）、summary 算出
- `{outputPath}` に fact-check.json を Write ツールで書き出し
- コンソール表示: 各 claim の verdict + 総合判定
- 最終出力: overallVerdict と summary をテキストで返す

**ソース**: `.claude/skills/generate/SKILL.md` の行 426〜519 をベースに、入力セクションを追加し、自己完結するエージェント定義にする。

**Step 2: コミット**

```bash
git add .claude/agents/fact-checker.md
git commit -m "feat: add fact-checker agent for reusable fact verification"
```

---

## Task 4: /review スキルをリファクタリング

最もシンプルなスキルから着手。style-loader + article-reviewer の薄いラッパーにする。

**Files:**
- Modify: `.claude/skills/review/SKILL.md`

**Step 1: 現在のスキルを読み込み、リファクタリング後の内容に書き換え**

リファクタリング後の構成（~30行）:

```
---
name: review
description: (現状維持)
argument-hint: (現状維持)
disable-model-invocation: true
---

イントロ（現状維持）

## Step 0: 文体ロード

1. .claude/agents/style-loader.md を Read ツールで読み込む
2. 読み込んだ内容に「refreshStyle: false」を追記
3. Agent ツールで呼び出し（model: sonnet）
4. 返却された JSON を styleProfile として保持

## Step 1: 記事読み込み

（現状の Step 1 をそのまま維持 — $ARGUMENTS からパス取得、Read、outputDir 抽出）

## Step 2: 記事レビュー

1. .claude/agents/article-reviewer.md を Read ツールで読み込む
2. 読み込んだ内容の末尾に以下を追記:
   - outputPath: {outputDir}/review.json
   - styleProfile: {styleProfile の JSON}
   - article: {article の JSON}
3. Agent ツールで呼び出し（model: sonnet）
4. 返却テキストからスコアを取得

## 完了
（現状維持）
```

**Step 2: リファクタリング前後で出力パスが一致していることを grep で確認**

```bash
grep -c "outputDir" .claude/skills/review/SKILL.md  # outputDir 参照が残っていること
grep -c "output/review.json" .claude/skills/review/SKILL.md  # 0 であること
```

**Step 3: コミット**

```bash
git add .claude/skills/review/SKILL.md
git commit -m "refactor: simplify /review skill to use style-loader and article-reviewer agents"
```

---

## Task 5: /fact-check スキルをリファクタリング

**Files:**
- Modify: `.claude/skills/fact-check/SKILL.md`

**Step 1: fact-checker エージェントのラッパーに書き換え**

リファクタリング後の構成（~25行）:

```
---
(frontmatter 現状維持)
---

イントロ（現状維持）

## Step 0: 記事読み込み

（現状の Step 0 をそのまま維持 — パス取得、Read、outputDir 抽出）

## Step 1: ファクトチェック

1. .claude/agents/fact-checker.md を Read ツールで読み込む
2. 読み込んだ内容の末尾に以下を追記:
   - outputPath: {outputDir}/fact-check.json
   - article: {article の JSON}
3. Agent ツールで呼び出し（model: sonnet）
4. 返却テキストから判定を取得して表示

## 完了
（現状維持）
```

**Step 2: 確認**

```bash
grep -c "outputDir" .claude/skills/fact-check/SKILL.md  # outputDir 参照が残っていること
grep -c "output/fact-check.json" .claude/skills/fact-check/SKILL.md  # 0 であること
```

**Step 3: コミット**

```bash
git add .claude/skills/fact-check/SKILL.md
git commit -m "refactor: simplify /fact-check skill to use fact-checker agent"
```

---

## Task 6: /edit スキルをリファクタリング

**Files:**
- Modify: `.claude/skills/edit/SKILL.md`

**Step 1: Step 0 (文体ロード) を style-loader エージェント呼び出しに置換**

現在の行 40〜95 (文体ロードの全ロジック) を、以下に置き換える：

```
1. .claude/agents/style-loader.md を Read ツールで読み込む
2. 読み込んだ内容に「refreshStyle: false」を追記
3. Agent ツールで呼び出し（model: sonnet）
4. 返却された JSON を styleProfile として保持
```

**Step 2: Step 5 (レビュー) を article-reviewer エージェント呼び出しに置換**

現在の行 232〜406 (レビューの全ロジック) を、以下に置き換える：

```
1. .claude/agents/article-reviewer.md を Read ツールで読み込む
2. 読み込んだ内容の末尾に outputPath, styleProfile, article を追記
3. Agent ツールで呼び出し（model: sonnet）
4. 返却テキストからスコアを表示
```

**Step 3: 固有ロジック (Step 1-4, Step 6) はそのまま維持**

- Step 1: 既存記事取得
- Step 2: 記事構造表示
- Step 3: 修正ループ
- Step 4: article.json 書き出し
- Step 6: 最終確認 & WP更新

**Step 4: 確認**

```bash
wc -l .claude/skills/edit/SKILL.md  # ~220行以下であること
grep -c "sessionDir" .claude/skills/edit/SKILL.md  # sessionDir 参照が残っていること
```

**Step 5: コミット**

```bash
git add .claude/skills/edit/SKILL.md
git commit -m "refactor: simplify /edit skill to use style-loader and article-reviewer agents"
```

---

## Task 7: /revise スキルをリファクタリング

**Files:**
- Modify: `.claude/skills/revise/SKILL.md`

**Step 1: Step 0 (文体ロード) を style-loader エージェント呼び出しに置換**

現在の行 38〜96 を置き換え。

**Step 2: Step 6 (レビュー) を article-reviewer エージェント呼び出しに置換**

現在の行 238〜412 を置き換え。

**Step 3: Step 7 (ファクトチェック) を fact-checker エージェント呼び出しに置換**

現在の行 413〜512 を置き換え。

**Step 4: 固有ロジック (Step 1-5, Step 8) はそのまま維持**

- Step 1: 既存記事取得
- Step 2: 記事診断
- Step 3: SEO再調査
- Step 4: リライト方針
- Step 5: 本文リライト & ファイル書き出し
- Step 8: WordPress 記事更新

**Step 5: 確認**

```bash
wc -l .claude/skills/revise/SKILL.md  # ~270行以下であること
```

**Step 6: コミット**

```bash
git add .claude/skills/revise/SKILL.md
git commit -m "refactor: simplify /revise skill to use all three shared agents"
```

---

## Task 8: /generate スキルをリファクタリング

**Files:**
- Modify: `.claude/skills/generate/SKILL.md`

**Step 1: Step 0 (文体分析) を style-loader エージェント呼び出しに置換**

現在の行 37〜95 を置き換え。generate の場合は `--refresh-style` フラグを `refreshStyle` パラメータに変換する。

**Step 2: Step 7 (レビュー) を article-reviewer エージェント呼び出しに置換**

現在の行 251〜424 を置き換え。

**Step 3: Step 8 (ファクトチェック) を fact-checker エージェント呼び出しに置換**

現在の行 426〜519 を置き換え。

**Step 4: 固有ロジック (Step 1-6, Step 9) はそのまま維持**

- Step 1: キーワード分析
- Step 2: SEO分析
- Step 3: 意図深掘り
- Step 4: 差別化設計
- Step 5: アウトライン作成
- Step 6: 記事本文生成 & ファイル書き出し
- Step 9: WordPress 下書き投稿

**Step 5: 確認**

```bash
wc -l .claude/skills/generate/SKILL.md  # ~280行以下であること
```

**Step 6: コミット**

```bash
git add .claude/skills/generate/SKILL.md
git commit -m "refactor: simplify /generate skill to use all three shared agents"
```

---

## Task 9: CLAUDE.md 更新

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Architecture セクションにエージェントを追加**

```
.claude/agents/style-loader.md       ← 文体キャッシュの読込/分析/保存（共通エージェント）
.claude/agents/article-reviewer.md   ← 5カテゴリ並列レビュー（共通エージェント）
.claude/agents/fact-checker.md       ← ファクトチェック並列検証（共通エージェント）
```

**Step 2: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with shared agents architecture"
```

---

## Task 10: 最終確認

**Step 1: 全スキルに旧ロジックの残存がないか確認**

```bash
# 文体ロードのインライン定義が残っていないこと
grep -r "sentenceEndings" .claude/skills/ --include="*.md"
# → 0件であること（エージェント側にのみ存在すべき）

# レビューのサブエージェント定義が残っていないこと
grep -r "レビュー: SEO" .claude/skills/ --include="*.md"
# → 0件であること

# ファクトチェックのサブエージェント定義が残っていないこと
grep -r "ファクトチェッカーです" .claude/skills/ --include="*.md"
# → 0件であること
```

**Step 2: エージェントファイルの存在確認**

```bash
ls -la .claude/agents/
# style-loader.md, article-reviewer.md, fact-checker.md が存在すること
```

**Step 3: 行数の確認**

```bash
wc -l .claude/skills/*/SKILL.md .claude/agents/*.md
# skills 合計: ~600行以下（現在 1,966行）
# agents 合計: ~350行
# 全体: ~950行（現在 1,966行から約50%削減）
```

**Step 4: TypeScript 型チェック（既存スクリプトが壊れていないこと）**

```bash
npx tsc --noEmit
```
