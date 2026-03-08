# シリーズ再設計 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 現シリーズ（エンジニア向け16記事）を廃止し、非エンジニア向け新シリーズ（全9記事）のインフラを整備する

**Architecture:** PR #4 のクローズ → WP下書き削除 → 旧記事ファイル削除 → シリーズ設定ファイルを新構成に書き換え → CLAUDE.md 更新 → コミット。設計の詳細は `docs/plans/2026-03-08-series-redesign.md` を参照。

**Tech Stack:** GitHub CLI (`gh`), WordPress REST API, Git

---

### Task 1: PR #4 をクローズする

**Files:**
- None (GitHub API operation)

**Step 1: PR をクローズ**

```bash
gh pr close 4 --repo gas-lab-2022/article-pipeline --comment "シリーズ再設計のためクローズ。非エンジニア向けの新シリーズとして作り直します。詳細: docs/plans/2026-03-08-series-redesign.md"
```

Expected: PR #4 が Closed 状態になる

---

### Task 2: WP 下書きを削除する

**Files:**
- None (WordPress API operation)

**Step 1: WP REST API で下書き（postId: 6990）を削除**

```bash
source .env
curl -s -X DELETE \
  "${WP_SITE_URL}/wp-json/wp/v2/posts/6990?force=true" \
  -u "${WP_USERNAME}:${WP_APP_PASSWORD}" \
  | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Deleted:', d.id, d.title?.rendered || 'OK')"
```

Expected: `Deleted: 6990 Claude Codeとは？...` のような出力

---

### Task 3: main ブランチに切り替え、旧記事ファイルを削除

**Files:**
- Delete: `articles/programming-zero.net/what-is-claude-code/` (entire directory)

**Step 1: main に切り替え**

```bash
git checkout main
git pull origin main
```

**Step 2: 旧記事ディレクトリを削除**

```bash
rm -rf articles/programming-zero.net/what-is-claude-code/
```

**Step 3: 確認**

```bash
ls articles/programming-zero.net/
```

Expected: `what-is-claude-code` ディレクトリが存在しない

---

### Task 4: シリーズ設定ファイルを新構成に書き換え

**Files:**
- Modify: `docs/series/programming-zero.net/claude-code/series.md`
- Modify: `docs/series/programming-zero.net/claude-code/design.md`

**Step 1: series.md を新シリーズ構成に書き換え**

```markdown
---
seriesName: エンジニアなしでできる時代へ — 非エンジニアのAIコーディング入門
targetSite: programming-zero.net
designDoc: docs/plans/2026-03-08-series-redesign.md
---

## #1 — AI 業務効率化【気づく】
- **Title**: AIで業務を自動化する時代に非エンジニアが知っておくべきこと
- **Sub KW**: AI 自動化 ツール, 業務 自動化 AI
- **Priority**: 2
- **Status**: draft
- **Related**: 2, 3
- **Description**: 2026年のAI活用の現状。GAS・ノーコードの限界とAIコーディングという新選択肢。

## #2 — エンジニア不要 AI【気づく】
- **Title**: 「エンジニアに頼むしかない」を終わらせるAIコーディングとは
- **Sub KW**: エンジニア 依頼 コスト, 社内SE いない, エンジニア 外注 高い
- **Priority**: 4
- **Status**: draft
- **Related**: 1, 3
- **Description**: エンジニア外注の課題。AIコーディングで非エンジニアが自走する仕組みを図解。

## #3 — Claude Code 非エンジニア【知る】
- **Title**: Claude Codeとは？非エンジニアこそ使うべき理由
- **Sub KW**: Claude Code とは, AIコーディング 非エンジニア
- **Priority**: 1
- **Status**: draft
- **Related**: 1, 2, 4, 5
- **Description**: Claude Codeの概要を非エンジニア向けに図解で解説。なぜ非エンジニアに向いているのか。

## #4 — Claude Code 料金 外注比較【知る】
- **Title**: Claude Codeの料金は？エンジニア外注と比較してどれだけお得か
- **Sub KW**: Claude Code 料金, AI ツール コスト, エンジニア 外注 費用
- **Priority**: 3
- **Status**: draft
- **Related**: 3, 5
- **Description**: 料金プラン一覧とエンジニア外注コスト比較。ROI試算。

## #5 — GAS 限界 AI【実感する】
- **Title**: GAS・ノーコードの限界を超える！Claude CodeでSNS運用を自動化してみた
- **Sub KW**: GAS 限界, SNS運用 自動化 AI, SNS 自動化 ツール
- **Priority**: 5
- **Status**: draft
- **Related**: 3, 4, 6, 7
- **Description**: GASツールの限界とClaude Codeでの実演。GASラボ顧客に直接刺さる内容。

## #6 — 社内ツール 自作 AI【実感する】
- **Title**: 非エンジニアがClaude Codeで社内ツールを自作してみた
- **Sub KW**: 社内ツール 自作 AI, スプレッドシート 自動化 AI, 業務アプリ 作り方
- **Priority**: 6
- **Status**: draft
- **Related**: 5, 7
- **Description**: スプレッドシート連携ツール・簡易Webダッシュボードの実演。

## #7 — データ分析 AI【実感する】
- **Title**: Claude Codeでデータ分析・レポート作成を自動化する方法
- **Sub KW**: データ分析 AI, レポート 自動化 AI, Looker Studio 自動化
- **Priority**: 7
- **Status**: draft
- **Related**: 5, 6, 8
- **Description**: CSVデータ分析・Looker Studio連携の実演。

## #8 — Claude Code 企業導入【導入する】
- **Title**: Claude Codeを組織に導入するためのロードマップ
- **Sub KW**: Claude Code 企業導入, AI導入 企業, AIコーディング チーム
- **Priority**: 8
- **Status**: draft
- **Related**: 3, 4, 7
- **Description**: 導入ステップ・セキュリティ・研修のポイント。コンサルCTAへの導線。

## #9 — ハブ記事【まとめ】
- **Title**: 【完全ガイド】非エンジニアのためのAIコーディング入門
- **Sub KW**: AIコーディング 入門, 非エンジニア プログラミング AI
- **Priority**: 9
- **Status**: draft
- **Related**: 1, 2, 3, 4, 5, 6, 7, 8
- **Description**: 全記事リンク集 + シリーズ概要。最後に作成。
```

**Step 2: design.md を新設計ドキュメントへのリダイレクトに変更**

```markdown
# シリーズ設計ドキュメント

設計ドキュメントは以下に移行しました:

→ [docs/plans/2026-03-08-series-redesign.md](../../../plans/2026-03-08-series-redesign.md)
```

**Step 3: 確認**

ファイルの内容を Read ツールで確認し、YAML frontmatter と各記事エントリが正しいことを確認。

---

### Task 5: CLAUDE.md のシリーズ関連セクションを更新

**Files:**
- Modify: `CLAUDE.md`

**Step 1: CLAUDE.md 内のシリーズ記述を確認**

CLAUDE.md を読み、シリーズに言及している箇所を特定する。

**Step 2: 旧シリーズへの参照を新シリーズ情報に更新**

更新対象:
- `docs/series/{domain}/{slug}/series.md` の説明がそのままであれば変更不要（パス構造は同じ）
- シリーズ名やシリーズ概要への言及があれば新シリーズ名に更新

---

### Task 6: コミット

**Files:**
- All changes from Tasks 3-5

**Step 1: 変更をステージング**

```bash
git add -A articles/programming-zero.net/what-is-claude-code/
git add docs/series/programming-zero.net/claude-code/series.md
git add docs/series/programming-zero.net/claude-code/design.md
git add docs/plans/2026-03-08-series-redesign.md
git add docs/plans/2026-03-08-series-redesign-impl.md
git add CLAUDE.md
```

**Step 2: コミット**

```bash
git commit -m "refactor: redesign article series for non-engineer target audience

- Close old series 'Claude Code完全ガイド' (engineer-focused, 16 articles)
- Create new series 'エンジニアなしでできる時代へ' (non-engineer-focused, 9 articles)
- Delete old article: what-is-claude-code
- Add series redesign design doc
- Update series.md and design.md for new structure"
```

**Step 3: 確認**

```bash
git status
git log --oneline -3
```

Expected: clean working tree, latest commit is the refactor

---

### Task 7: 旧ブランチの削除

**Step 1: リモートの旧ブランチを削除**

```bash
git push origin --delete article/programming-zero.net/what-is-claude-code
git push origin --delete article/what-is-claude-code
```

**Step 2: ローカルの旧ブランチを削除**

```bash
git branch -d article/programming-zero.net/what-is-claude-code
```

**Step 3: 確認**

```bash
git branch -a
```

Expected: 旧記事ブランチが存在しない
