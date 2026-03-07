# ファクトチェック

- **チェック日時**: 2026-03-07T17:50:00+09:00
- **記事タイトル**: Claude Codeとは？できること・特徴をわかりやすく解説
- **総合判定**: warning
- **検証結果**: 9/11 verified

## サマリー

11件の事実主張のうち9件が検証済み（verified）、1件が要注意（disputed: コンテキストウィンドウ100万トークンはBeta機能であり条件付き）、1件が情報更新が必要（outdated: データトレーニング不使用ポリシーは2025年8月に変更済み）。特にデータプライバシーに関する主張は最新のポリシー変更を反映する修正が必要です。

## 検証結果一覧

### 1. ✅ Claude CodeはAnthropic社が開発した

- **カテゴリ**: 固有名詞の属性
- **根拠**: Claude CodeはAnthropic社が開発・公開しているエージェント型コーディングツール。GitHubリポジトリ（anthropics/claude-code）や公式サイト（claude.com/product/claude-code）で確認済み。

### 2. ✅ Claude Codeは2025年にリリースされた

- **カテゴリ**: 固有名詞の属性
- **根拠**: Claude Codeは2025年2月にプレビュー版としてリリースされ、2025年5月にClaude 4と同時に一般提供（GA）が開始された。

### 3. ❌ Claude Codeは最大100万トークンのコンテキストウィンドウを持つ

- **カテゴリ**: 数値・統計
- **根拠**: Claude Opus 4.6やSonnet 4.6などのモデルは100万トークンのコンテキストウィンドウに対応しているが、これはBeta機能であり、デフォルトでは200Kトークンのコンテキストウィンドウが使用される。また、Usage Tier 4以上の組織またはカスタムレート制限のある組織のみが利用可能。Claude Code自体のコンテキストウィンドウとモデルのAPIコンテキストウィンドウは異なる場合がある。
- **修正提案**: 「最大100万トークンのコンテキストウィンドウを持つ」→「使用するモデル（Opus 4.6、Sonnet 4.6等）は最大100万トークンのコンテキストウィンドウに対応（Beta機能、デフォルトは200K）」のように条件を明記することを推奨。

### 4. ✅ Terminal/VSCode/JetBrains/Desktop/Web/Slackで利用可能

- **カテゴリ**: 手順・仕様
- **根拠**: Anthropic公式（Boris Cherny氏のThreads投稿）にて、Claude CodeはTerminal、Desktop、Web、iOS、Android、VSCode、JetBrains、GitHub、Slackでネイティブに利用可能と確認。記事に記載されたプラットフォームはすべて正確。さらにiOS/Android/GitHubも利用可能。

### 5. ✅ MCP（Model Context Protocol）はオープンスタンダード

- **カテゴリ**: 手順・仕様
- **根拠**: MCPはAnthropicが2024年11月に発表したオープンプロトコルで、AIシステムと外部データソース・ツールを接続するための標準仕様。OpenAI・Microsoftも採用を表明し、2025年12月にはAgentic AI Foundationに寄贈された。

### 6. ✅ 無料プランでは利用不可、Proプラン$20/月から

- **カテゴリ**: 数値・統計
- **根拠**: Claude Codeは無料プランでは利用不可。Pro（$20/月）以上のサブスクリプションまたはAPIキーが必要。Anthropic公式ヘルプセンターおよび複数の価格比較サイトで確認済み。

### 7. ✅ Max 5x $100/月、Max 20x $200/月

- **カテゴリ**: 数値・統計
- **根拠**: Claude Max 5xは$100/月、Max 20xは$200/月。Anthropic公式価格ページ（claude.com/pricing/max）および複数の情報源で確認済み。

### 8. ✅ Teamプラン $30/人/月

- **カテゴリ**: 数値・統計
- **根拠**: TeamプランのStandardシートは月額払いで$30/人/月、年払いで$25/人/月。$30/人/月は月額払い時の価格として正確。Anthropic公式ヘルプセンターで確認済み。
- **修正提案**: より正確には「$30/人/月（月払い）、$25/人/月（年払い）」と記載すると親切。

### 9. ✅ 2026年現在ネイティブインストーラーが推奨、Node.js不要

- **カテゴリ**: 手順・仕様
- **根拠**: Anthropic公式（Threads投稿）にて「Claude Code's native installer is now generally available. It's simpler, more stable, and doesn't require Node.js. We recommend this as the default installation method for all Claude Code users going forward.」と確認。複数の2026年ガイドでもNode.js不要と記載。

### 10. ✅ インストールコマンド: curl -fsSL https://claude.ai/install.sh | bash

- **カテゴリ**: 手順・仕様
- **根拠**: Anthropic公式ドキュメント（code.claude.com/docs/en/setup）および複数のインストールガイドで、macOS/Linuxでのインストールコマンドとして「curl -fsSL https://claude.ai/install.sh | bash」が記載されていることを確認。

### 11. ⏰ Anthropicはユーザーデータをモデルトレーニングに使用しない

- **カテゴリ**: 手順・仕様
- **根拠**: 2025年8月以前はAnthropicはコンシューマーチャットデータをモデルトレーニングに使用していなかったが、2025年8月にポリシーが変更され、オプトアウト方式に移行。ユーザーが設定でオフにしない限り、チャットデータはモデルトレーニングに使用される。ただし、Commercial Terms（Claude for Work、API経由等）には適用されず、これらのデータはトレーニングに使用されない。
- **修正提案**: 「ユーザーデータをモデルトレーニングに使用しない」→「コンシューマー向けサービスでは2025年8月以降オプトアウト方式を採用（設定でオフ可能）。商用プラン（Team/Enterprise）およびAPI利用ではデータはトレーニングに使用されない」に修正を推奨。
