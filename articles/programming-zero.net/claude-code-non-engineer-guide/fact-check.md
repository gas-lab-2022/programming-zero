# ファクトチェック

- **チェック日時**: 2026-03-09
- **記事タイトル**: Claude Codeとは？非エンジニアこそ使うべき3つの理由【図解で解説】
- **総合判定**: ⚠️ WARNING（unverified 1件）
- **検証結果**: 10/11 verified

## サマリー

記事中の主要な事実主張11件を検証した結果、10件が verified（検証済み）、1件が unverified（未検証）となった。unverified は「無料プランではClaude Codeを利用できない」という記述で、2026年現在では無料プランでもWeb版で限定的にClaude Codeを利用できるため、記事の記述は不正確である可能性がある。その他の主張はすべて信頼できる情報源で裏付けが取れた。

## 検証結果一覧

### 1. GitHubの公開コミットの約4%をClaude Codeが生成

- **種別**: 数値・統計
- **記事の記述**: 「GitHubの公開コミットの約4%を生成するほど普及が進んでおり」
- **verdict**: ✅ verified
- **evidence**: SemiAnalysis のレポート（2026年2月）により、GitHub公開コミットの4%がClaude Codeによるものと報告されている。GIGAZINE、OfficeChai、Slashdot等の複数メディアが同じ数値を引用。Dylan Patel（SemiAnalysis）のX投稿でも同じ数値が確認できる。
- **suggestion**: なし

### 2. Claude CodeはAnthropic社が提供するエージェント型AIコーディングツール

- **種別**: 固有名詞の属性
- **記事の記述**: 「Anthropic社が提供するエージェント型AIコーディングツール」
- **verdict**: ✅ verified
- **evidence**: Anthropic公式サイト（claude.com/product/claude-code）および公式ドキュメント（code.claude.com/docs/ja/overview）で、Claude CodeがAnthropic社のエージェント型コーディングツールであることが明記されている。
- **suggestion**: なし

### 3. Proプラン: 月額20ドル〜

- **種別**: 手順・仕様
- **記事の記述**: 「Claudeの有料サブスクリプション（Proプラン: 月額20ドル〜）」
- **verdict**: ✅ verified
- **evidence**: Claude公式料金ページ（claude.com/pricing）およびAnthropic Help Center で、Proプランが月額$20（年払いの場合$17/月）であることが確認できる。複数の第三者レビューサイト（ScreenApp、IntuitionLabs、Juma等）でも同じ価格が記載。
- **suggestion**: なし

### 4. 5つの利用環境（Webブラウザ、デスクトップアプリ、ターミナル、VS Code/Cursor、JetBrains/Slack）

- **種別**: 手順・仕様
- **記事の記述**: 「5つの利用環境」として Webブラウザ、デスクトップアプリ、ターミナル（CLI）、VS Code / Cursor、JetBrains / Slack を列挙
- **verdict**: ✅ verified
- **evidence**: Claude Code公式ドキュメント（code.claude.com/docs/en/overview）で「Terminal, VS Code, JetBrains, Desktop, and Web」の5環境が明記。さらにSlack連携も公式に提供されている。記事では JetBrains と Slack を1つにまとめて「5つ」としているが、公式でも主要5環境として紹介されており、Slackは追加の統合先として扱われている。
- **suggestion**: なし。記事の分類は公式の表現とやや異なるが、実質的に正確。

### 5. claude.ai/codeでブラウザから利用可能

- **種別**: 手順・仕様
- **記事の記述**: 「claude.ai/codeにアクセスするだけで始められます」
- **verdict**: ✅ verified
- **evidence**: Claude Code公式ドキュメント（code.claude.com/docs/en/claude-code-on-the-web）で、Web版Claude Codeの存在と利用方法が確認できる。
- **suggestion**: なし

### 6. macOSとWindowsに対応したデスクトップアプリがある

- **種別**: 手順・仕様
- **記事の記述**: 「macOSとWindowsに対応したスタンドアロンのデスクトップアプリも用意されています」
- **verdict**: ✅ verified
- **evidence**: Claude公式ダウンロードページ（claude.com/download）でmacOS版とWindows版が提供されている。Windows版は2026年2月10日にリリースされた。Claude Code Docs（code.claude.com/docs/en/desktop）でも確認可能。
- **suggestion**: なし

### 7. VS CodeやCursorの拡張機能として利用可能

- **種別**: 手順・仕様
- **記事の記述**: 「VS CodeやCursorといったコードエディタの拡張機能として利用できます」
- **verdict**: ✅ verified
- **evidence**: 公式ドキュメントで VS Code および Cursor の拡張機能としてのインストール方法が記載されている（Extensions view で "Claude Code" を検索）。複数の比較記事（Builder.io、SitePoint、Particula Tech等）でも確認済み。
- **suggestion**: なし

### 8. JetBrains IDEのプラグインやSlack連携に対応

- **種別**: 手順・仕様
- **記事の記述**: 「JetBrains IDEのプラグインやSlack連携にも対応しています。Slackではバグレポートを送ると自動でプルリクエストを作成してくれる」
- **verdict**: ✅ verified
- **evidence**: 公式ドキュメントでJetBrains IDE（IntelliJ IDEA, PyCharm, WebStorm等）向けプラグインが確認できる。Slack連携については公式製品ページで「@Claude in Slack with a bug report and get a pull request back」と記載されている。
- **suggestion**: なし

### 9. iOSアプリからもアクセス可能

- **種別**: 手順・仕様
- **記事の記述**: 「iOSアプリからもアクセスできるため、外出先からスマホで作業の進捗を確認することもできます」
- **verdict**: ✅ verified
- **evidence**: 2025年10月にClaude CodeがClaude iOSアプリ内で公式に利用可能になった。App Storeでも「Claude by Anthropic」アプリが確認できる。2026年2月にはさらに「Remote Control」機能がリリースされ、モバイルからの操作性が向上した。
- **suggestion**: なし

### 10. TeamプランやEnterpriseプランがある

- **種別**: 手順・仕様
- **記事の記述**: 「企業向けのTeamプランやEnterpriseプランでは、より高度なセキュリティ機能が利用できます」
- **verdict**: ✅ verified
- **evidence**: Claude公式料金ページ（claude.com/pricing）およびHelp Center でTeamプラン（Standard席 $25/月〜）とEnterpriseプラン（カスタム料金、最低20席）が確認できる。Enterpriseプランでは SSO、SCIM、監査ログ、コンプライアンスAPI等の高度なセキュリティ機能が提供されている。
- **suggestion**: なし

### 11. 無料プランではClaude Codeを利用できない

- **種別**: 手順・仕様
- **記事の記述**: 「無料プランでは利用できません」
- **verdict**: ⚠️ unverified
- **evidence**: 2026年現在、無料プランでもWeb版Claude Code（claude.ai/code）で限定的にClaude Codeを利用できるとの情報がある。ただしターミナル版（CLI）のフル機能利用にはProプラン以上が必要。「無料プランでは利用できません」は完全に正確とは言えない。
- **suggestion**: 「無料プランでは利用できません」を「無料プランでは限定的なWeb版のみ利用可能で、フル機能を使うにはProプラン以上が必要です」に修正することを推奨。
