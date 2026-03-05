# 共通ロジックのエージェント抽出リファクタリング

Date: 2026-03-05

## 背景

5つのスキル (generate, revise, edit, review, fact-check) で以下のロジックが重複:
- 文体ロード: ~58行 x 4箇所
- レビュー (5並列サブエージェント): ~175行 x 4箇所
- ファクトチェック (並列サブエージェント): ~80行 x 3箇所
- **合計: 1,966行中 ~1,170行が重複 (約60%)**

## 設計

### 新規エージェント (`.claude/agents/`)

#### `style-loader.md`
- **役割**: 文体キャッシュの読込/分析/保存
- **入力**: `--refresh-style` フラグの有無 (prompt)
- **処理**: .env からドメイン取得 → キャッシュ確認 → 必要なら WP 記事取得・分析 → キャッシュ書出
- **出力**: `styleProfile` JSON を返す
- **モデル**: sonnet

#### `article-reviewer.md`
- **役割**: 5カテゴリ並列レビュー + 集約 + ファイル書出
- **入力**: `outputPath` (書出先パス)、`styleProfile` JSON、`article` JSON (prompt)
- **処理**: 5つの haiku サブエージェントを並列起動 → 結果集約 → `{outputPath}` に review.json 書出
- **出力**: 総合評価テキスト (overallScore, summary, 各カテゴリスコア)
- **モデル**: sonnet (サブエージェントは haiku)

#### `fact-checker.md`
- **役割**: 主張抽出 + 並列 WebSearch 検証 + 集約 + ファイル書出
- **入力**: `outputPath` (書出先パス)、`article` JSON (prompt)
- **処理**: 主張抽出 → N 個の haiku サブエージェントで並列検証 → 集約 → `{outputPath}` に fact-check.json 書出
- **出力**: 総合判定テキスト (overallVerdict, summary)
- **モデル**: sonnet (サブエージェントは haiku)

### スキル変更

各スキルは共通ステップを Agent ツール呼び出し1行に置き換え:

| スキル | Before | After | 削減 |
|---|---|---|---|
| `/generate` | 544行 | ~280行 | -49% |
| `/revise` | 534行 | ~270行 | -49% |
| `/edit` | 442行 | ~220行 | -50% |
| `/review` | 263行 | ~30行 | -89% |
| `/fact-check` | 183行 | ~25行 | -86% |

### エージェント呼び出しパターン

```markdown
## Step 0: 文体分析

Agent ツールで `style-loader` を呼び出してください：
- prompt: --refresh-style フラグの有無
- 返却された styleProfile JSON を保持

## Step 7: 記事レビュー

Agent ツールで `article-reviewer` を呼び出してください：
- prompt: outputPath={sessionDir}/review.json, styleProfile, article の JSON
- エージェントが review.json を書き出す
- 返却テキストからスコアを表示

## Step 8: ファクトチェック

Agent ツールで `fact-checker` を呼び出してください：
- prompt: outputPath={sessionDir}/fact-check.json, article の JSON
- エージェントが fact-check.json を書き出す
- 返却テキストから判定を表示
```

### 変更対象ファイル

| 操作 | ファイル |
|---|---|
| 新規 | `.claude/agents/style-loader.md` |
| 新規 | `.claude/agents/article-reviewer.md` |
| 新規 | `.claude/agents/fact-checker.md` |
| 編集 | `.claude/skills/generate/SKILL.md` |
| 編集 | `.claude/skills/revise/SKILL.md` |
| 編集 | `.claude/skills/edit/SKILL.md` |
| 編集 | `.claude/skills/review/SKILL.md` |
| 編集 | `.claude/skills/fact-check/SKILL.md` |
| 編集 | `CLAUDE.md` |

### 後方互換性

- ユーザーが呼ぶコマンドは一切変わらない
- 出力ファイルのフォーマット・パスも変わらない
- セッションディレクトリの仕組みもそのまま
