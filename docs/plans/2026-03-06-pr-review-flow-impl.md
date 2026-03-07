# PR-Based Human Review Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace direct WP publishing with PR-based human review flow. Articles are committed to `articles/` directory, reviewed via GitHub PR, and auto-published to WP on merge via GitHub Actions.

**Architecture:** `/generate` Step 9 creates a git branch, copies article files to `articles/{slug}/`, generates a review-friendly Markdown version, and opens a PR. GitHub Actions workflow on main branch merge publishes the article to WordPress.

**Tech Stack:** GitHub Actions, gh CLI, existing TypeScript scripts (wp-publish-draft.ts, wp-set-seo-fields.ts)

---

### Task 1: Initialize `articles/` directory

**Files:**
- Create: `articles/.gitkeep`

**Step 1: Create the directory placeholder**

```bash
mkdir -p articles && touch articles/.gitkeep
```

**Step 2: Commit**

```bash
git add articles/.gitkeep
git commit -m "chore: initialize articles/ directory for PR-based review"
```

---

### Task 2: Create GitHub Actions workflow for WP auto-publish

**Files:**
- Create: `.github/workflows/wp-publish.yml`

**Step 1: Create the workflow file**

```yaml
name: Publish to WordPress

on:
  push:
    branches: [main]
    paths: ['articles/*/article.json']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - run: npm ci

      - name: Detect changed articles
        id: changed
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD -- 'articles/*/article.json' | tr '\n' ' ')
          echo "files=$CHANGED" >> "$GITHUB_OUTPUT"

      - name: Publish to WordPress
        if: steps.changed.outputs.files != ''
        env:
          WP_SITE_URL: ${{ secrets.WP_SITE_URL }}
          WP_USERNAME: ${{ secrets.WP_USERNAME }}
          WP_APP_PASSWORD: ${{ secrets.WP_APP_PASSWORD }}
          WP_SEO_METHOD: ${{ secrets.WP_SEO_METHOD }}
          WP_SEO_TITLE_KEY: ${{ secrets.WP_SEO_TITLE_KEY }}
          WP_SEO_DESC_KEY: ${{ secrets.WP_SEO_DESC_KEY }}
        run: |
          for f in ${{ steps.changed.outputs.files }}; do
            echo "Publishing: $f"
            npx tsx scripts/wp-publish-draft.ts "$f"
          done

      - name: Summary
        if: steps.changed.outputs.files != ''
        run: |
          echo "## Published Articles" >> "$GITHUB_STEP_SUMMARY"
          for f in ${{ steps.changed.outputs.files }}; do
            TITLE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$f','utf8')).title)")
            echo "- **$TITLE** (\`$f\`)" >> "$GITHUB_STEP_SUMMARY"
          done
```

**Step 2: Verify YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/wp-publish.yml'))"
```

Expected: No output (valid YAML).

**Step 3: Commit**

```bash
git add .github/workflows/wp-publish.yml
git commit -m "ci: add GitHub Actions workflow for WP auto-publish on merge"
```

---

### Task 3: Update `/generate` SKILL.md — Step 0-pre (input prompts)

**Files:**
- Modify: `.claude/skills/generate/SKILL.md:12-33`

**Step 1: Update the user prompt**

Replace the current Step 0-pre prompt question about WP publish with PR creation:

Change:
```
1. WordPress に下書き投稿しますか？（デフォルト: はい）
```

To:
```
1. レビュー用の PR を作成しますか？（デフォルト: はい）
   ※ PR マージ時に GitHub Actions で WP に自動投稿されます
```

Change the variable description:
```
- `isLocal`: PR を作成しない場合は true（ローカル確認のみ）
```

Update the final instruction:
```
以降、すべてのステップの結果をコンテキストとして保持し、最終的に PR を作成してください（`isLocal` が true の場合はスキップ）。
```

**Step 2: Verify the edit is correct**

Read back lines 12-33 and confirm the changes.

**Step 3: Commit**

```bash
git add .claude/skills/generate/SKILL.md
git commit -m "feat: update /generate Step 0-pre to ask about PR creation instead of WP publish"
```

---

### Task 4: Update `/generate` SKILL.md — Replace Step 9 (WP publish → PR creation)

**Files:**
- Modify: `.claude/skills/generate/SKILL.md:454-480` (Step 9 + 完了 section)

**Step 1: Replace Step 9 with PR creation flow**

Replace the current Step 9 content (lines 454-468) with:

```markdown
## Step 9: PR 作成（オプション）

`isLocal` が true の場合は、このステップをスキップしてください。
`{sessionDir}/article.json` の保存のみで完了です。

`isLocal` が false の場合は、以下の手順で PR を作成してください。

### 9-1. ブランチ作成

```bash
git checkout -b article/{slug}
```

### 9-2. ファイル配置

`articles/{slug}/` ディレクトリを作成し、ファイルを配置してください：

```bash
mkdir -p articles/{slug}/screenshots
```

以下のファイルを Write ツールで `articles/{slug}/` に書き出してください：

1. **article.json**: `{sessionDir}/article.json` の内容をそのままコピー
2. **review.json**: `{sessionDir}/review.json` の内容をそのままコピー
3. **fact-check.json**: `{sessionDir}/fact-check.json` の内容をそのままコピー

`{sessionDir}/screenshots/` にファイルがある場合は Bash でコピー：

```bash
cp {sessionDir}/screenshots/*.png articles/{slug}/screenshots/ 2>/dev/null || true
```

### 9-3. article.md の生成

`article.json` の内容をレビュー用の Markdown ファイルとして `articles/{slug}/article.md` に変換・書き出してください。

フォーマット：

```markdown
---
title: "{title}"
slug: "{slug}"
metaDescription: "{metaDescription}"
tags: [{tags}]
---

（htmlContent を Markdown に変換した本文）
```

変換ルール：
- `<h2>` → `## `
- `<h3>` → `### `
- `<p>` → 段落テキスト（タグ除去）
- `<a href="URL">text</a>` → `[text](URL)`
- `<strong>` → `**text**`
- `<em>` → `*text*`
- `<ul><li>` → `- item`
- `<ol><li>` → `1. item`
- `<figure>` → `![alt](src)`（画像）
- `<code>` → `` `code` ``
- `<pre>` → コードブロック
- その他の HTML タグ → タグ除去してテキストのみ残す

### 9-4. コミット & プッシュ

```bash
git add articles/{slug}/
git commit -m "feat: add article '{title}'"
git push -u origin article/{slug}
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

---

### Auto Review
- **Score**: {overallScore}/100
- {review.json の主要な指摘をサマリー（3行程度）}

### Fact Check
- **Verdict**: {overallVerdict}
- {fact-check.json の主要な結果をサマリー（3行程度）}

---

{manualTasks がある場合のみ以下を出力}
### Manual Tasks
- [ ] {task1 description}
- [ ] {task2 description}
...

Manual tasks can be completed by committing to this branch:
- Screenshots: add to `articles/{slug}/screenshots/`
- Text data: comment on this PR

---

### Review Checklist
- [ ] 事実関係に誤りがないか
- [ ] 読者にとって分かりやすいか
- [ ] 文体がサイトのトーンに合っているか
PREOF
)"
```

PR が作成されたら、PR URL を取得して表示してください。
```

**Step 2: Update the 完了 section**

Replace the current completion section (lines 472-480) with:

```markdown
## 完了

すべてのステップが完了しました。以下をまとめて報告してください：
- 記事タイトル
- `{sessionDir}/article.json` のパス（ローカル作業用）
- `articles/{slug}/article.md` のパス（PR レビュー用）
- レビュー結果の総合評価（`{sessionDir}/review.json`）
- ファクトチェック結果の総合判定（`{sessionDir}/fact-check.json`）
- PR を作成した場合は PR URL
- 手動タスクがある場合: 件数と PR 上での作業手順
```

**Step 3: Verify the full Step 9 reads correctly**

Read the modified file and confirm the flow is coherent.

**Step 4: Commit**

```bash
git add .claude/skills/generate/SKILL.md
git commit -m "feat: replace /generate Step 9 WP publish with PR creation flow"
```

---

### Task 5: Update `/series-generate` SKILL.md — Phase 3 adjustments

**Files:**
- Modify: `.claude/skills/series-generate/SKILL.md:162-213`

**Step 1: Update Phase 3 for PR-based flow**

The key changes to Phase 3:

**Step 3-1 (SEO fields)**: Remove or simplify. SEO fields are now set by GitHub Actions on merge, not during generation.

Replace lines 163-169 with:

```markdown
### Step 3-1: SEOフィールド確認

article.json に `seoTitle` と `metaDescription` が設定されていることを確認してください。
これらは PR マージ時に GitHub Actions が WP 投稿する際に自動設定されます。
```

**Step 3-2 (Series plan update)**: Update status values for PR flow.

Replace the status update description:

```markdown
- `status`: `"generated"`（`isLocal` が true の場合）または `"pr-created"`（PR作成済みの場合）
- `wpPostId`: null（PR マージ後に GitHub Actions が投稿するため、この時点では不明）
- `wpUrl`: null（同上）
- `prUrl`: PR の URL（`isLocal` が true の場合は null）
```

**Step 2: Verify the edits**

Read back the modified Phase 3 and confirm coherence.

**Step 3: Commit**

```bash
git add .claude/skills/series-generate/SKILL.md
git commit -m "feat: update /series-generate Phase 3 for PR-based flow"
```

---

### Task 6: Update `CLAUDE.md` — Document new flow

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the Skills & Commands section**

Add note about PR-based flow to the `/generate` command description:

```markdown
# 記事生成（対話形式: キーワード・PR作成・文体再分析を質問）
# PR マージ時に GitHub Actions で WP に自動投稿
/generate
```

**Step 2: Update Architecture — Step 9 description**

In the 記事生成パイプライン section, update Step 9:

```markdown
9. **PR作成**（対話で「いいえ」選択時はスキップ。マージ時に GitHub Actions で WP 自動投稿）
```

**Step 3: Add `articles/` to the Architecture file listing**

```markdown
articles/{slug}/                     ← レビュー済み記事（PR経由で git 管理）
.github/workflows/wp-publish.yml    ← GitHub Actions: PRマージ時のWP自動投稿
```

**Step 4: Update the article.json format section**

No changes needed — format is unchanged.

**Step 5: Verify edits**

Read back the modified sections.

**Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for PR-based review flow"
```

---

### Task 7: Verify end-to-end flow (manual checklist)

No code changes. Verify the implementation by running through the checklist:

**Step 1: Verify `articles/` directory exists**

```bash
ls -la articles/
```

Expected: `.gitkeep` file present.

**Step 2: Verify GitHub Actions workflow syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/wp-publish.yml'))"
```

Expected: No error output.

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (no TypeScript changes in this plan).

**Step 4: Verify `gh` CLI is available**

```bash
gh --version
```

Expected: Version output.

**Step 5: Verify SKILL.md changes are coherent**

Read `/generate` SKILL.md and confirm:
- Step 0-pre asks about PR creation (not WP publish)
- Step 9 creates branch, copies files, generates article.md, commits, pushes, creates PR
- Completion section references PR URL

Read `/series-generate` SKILL.md and confirm:
- Phase 3 references PR-based status values
- No references to direct WP publish remaining

**Step 6: Set up GitHub Secrets (manual — user action required)**

Remind the user to configure GitHub repository secrets:

```
GitHub Settings → Secrets and variables → Actions → New repository secret:
- WP_SITE_URL
- WP_USERNAME
- WP_APP_PASSWORD
- WP_SEO_METHOD (optional)
- WP_SEO_TITLE_KEY (optional)
- WP_SEO_DESC_KEY (optional)
```

**Step 7: Commit all changes if any fixups were needed**

```bash
git status
# If any uncommitted changes remain, commit them
```
