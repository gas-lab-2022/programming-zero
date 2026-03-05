# Claude Code完全ガイド記事シリーズ 設計ドキュメント

## 概要

programming-zero.net 向けに「Claude Code完全ガイド」として全16記事のシリーズを制作。プログラミング初心者・ビジネスサイド（経営層・マネージャー）をターゲットに、「知る→試す→使う→深める→選ぶ」の読者旅に沿って構成する。

## ターゲット読者

- プログラミング初心者（ターミナル操作も不慣れ）
- 経営層・マネージャー（チーム導入検討、ROI判断）
- AIコーディングツール未経験〜浅い層

## ゴール

インストール〜基本活用まで自走できる状態。MCP/Agentは「試せる」レベル。非エンジニアは「導入判断ができる」レベル。

## 記事一覧（全16記事）

### フェーズ1: 知る（3記事）

| # | メインKW (vol) | タイトル案 | サブKW |
|---|---|---|---|
| 1 | claude code とは (5,000) | Claude Codeとは？できること・特徴をわかりやすく解説 | 何ができる, 初心者 |
| 2 | claude code 料金 (50,000) | Claude Codeの料金プランを徹底解説【無料で使える？】 | 無料, plans, pricing, pro, max, 月額, 価格, api料金 |
| 3 | claude code (500,000) | 【2026年最新】Claude Code完全ガイド（ハブ記事） | 全サブKWのロングテール |

### フェーズ2: 試す（2記事）

| # | メインKW (vol) | タイトル案 | サブKW |
|---|---|---|---|
| 4 | claude code install (5,000) | Claude Codeのインストール方法【Mac/Windows対応】 | download, setup, インストール, 始め方, 環境構築 |
| 5 | claude code vscode (5,000) | Claude Code × VSCodeの導入と使い方 | vscode extension, vscode 使い方 |

### フェーズ3: 使う（5記事）

| # | メインKW (vol) | タイトル案 | サブKW |
|---|---|---|---|
| 6 | claude code 使い方 (5,000) | Claude Codeの使い方・基本コマンド完全リファレンス | commands, 始め方 |
| 7 | claude code 設定 (500) | Claude Codeの設定・カスタマイズ完全ガイド | 設定方法, best practice, models |
| 8 | — (戦略) | 非エンジニア・経営層のためのClaude Code活用ガイド | 初心者, 何ができる, 活用 |
| 9 | — (500) | Claude Codeのプロンプトのコツ・上手な指示の出し方 | コツ, best practice |
| 10 | — (混合) | Claude Codeトラブルシューティング・よくある質問 | overloaded, timeout, 遅い, rate limit, limits |

### フェーズ4: 深める（4記事）

| # | メインKW (vol) | タイトル案 | サブKW |
|---|---|---|---|
| 11 | claude code mcp (5,000) | Claude CodeのMCPとは？仕組みと設定方法 | mcp config, mcp設定, mcp server |
| 12 | — (500) | Claude Code MCPおすすめサーバーと実践ガイド | mcp github, mcp playwright, mcp figma |
| 13 | claude code agent (500) | Claude Codeのエージェント機能とは？仕組みと活用法 | plugins |
| 14 | claude code github (5,000) | Claude Code × GitHub連携でPR作成・レビューを自動化 | mcp github |

### フェーズ5: 選ぶ（2記事）

| # | メインKW (vol) | タイトル案 | サブKW |
|---|---|---|---|
| 15 | claude code vs cursor (500) | Claude Code vs Cursor 徹底比較【どっちを選ぶべき？】 | cline vs, cursor vs |
| 16 | claude code vs github copilot (500) | Claude Code vs GitHub Copilot 徹底比較 | codex vs, devin vs, vs gemini cli |

## #8 非エンジニア記事の方向性

経営層・マネージャー層向け戦略コンテンツ:
- チームに導入すべきか？判断ポイント
- ROI・生産性向上の実例
- 非コーディング業務での活用例（ドキュメント作成、分析、リサーチ等）
- 導入時の注意点・セキュリティ考慮

## スクリーンショット戦略

| 対象 | 手法 |
|---|---|
| Webページ（公式サイト、料金ページ等） | Playwright MCP で直接スクリーンショット |
| ターミナル画面（コマンド実行例等） | HTMLモックアップ生成 → Playwright MCP でスクリーンショット |

### HTMLターミナルモックの仕様

- macOS Terminal風ウィンドウクローム（赤黄緑の信号ボタン付きタイトルバー）
- フォント: SF Mono / Menlo（monospace）
- カラースキーム: 記事全体で統一（1つのテーマに固定）
- プロンプト文字列: 自然なもの（`$ ` 等）
- 適切なフォントサイズ・余白でブログ掲載に最適化

## 実装方針

### 既存パイプライン拡張（/generate + シリーズ計画）

`/generate` パイプラインをベースに、以下を追加:

1. **シリーズ計画ファイル**: 本ドキュメントを `/generate` 実行時のコンテキストとして参照。記事一覧・URL・内部リンク指示を含む
2. **内部リンク**: 本文生成時に関連記事への自然な言及を織り込む

### 新規スキル: /screenshot

記事生成とは独立して実行できるスクリーンショット撮影スキル:

- **Web撮影**: URL指定 → Playwright MCP → 画像保存
- **ターミナル撮影**: コマンド+出力指定 → HTMLモック生成 → Playwright MCP → 画像保存
- 出力先: `output/{sessionDir}/screenshots/`

## 内部リンク戦略

- **ハブ&スポーク**: #3（ハブ記事）から全記事へリンク
- **連載型**: 各記事に「前の記事 / 次の記事」リンク
- **文脈リンク**: 本文中で関連記事に自然に言及

## 公開フロー

1. 個別記事を `/generate` で生成 → レビュー → WP下書き投稿
2. スクショは `/screenshot` で別途生成 → WP上で記事に挿入
3. ハブ記事（#3）は随時更新（個別記事が増えるたびにリンク追加）
