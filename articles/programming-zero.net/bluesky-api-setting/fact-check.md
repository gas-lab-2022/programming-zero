# ファクトチェック結果

**対象記事**: Bluesky APIの利用設定方法【2026年最新】
**検証日**: 2026-03-13
**Overall Verdict**: PASS（重大な事実誤認なし）

---

## 検証結果サマリー

| # | 主張 | 判定 | 備考 |
|---|------|------|------|
| 1 | BlueskyはAT Protocolというオープンなプロトコルを採用 | verified | 公式ドキュメント・Wikipediaで確認済 |
| 2 | Bluesky APIはAPIキーの申請や審査が不要 | verified | 公式ドキュメント・複数の技術記事で確認済 |
| 3 | アプリパスワード形式は xxxx-xxxx-xxxx-xxxx | verified | 公式エコシステムドキュメント・FAQで確認済 |
| 4 | BOTやCLIツールにはOAuth非推奨、アプリパスワード方式推奨 | verified | 公式ブログ・OAuthドキュメントで確認済 |
| 5 | アプリパスワードではアカウント設定を変更できない | verified | 公式エコシステムドキュメントで確認済（ただし表現を精緻化推奨） |
| 6 | Bluesky APIは完全無料 | verified | 公式ドキュメント・複数ソースで確認済 |
| 7 | アプリパスワード名には英数字・スペース・ハイフン・アンダースコアのみ使用可能 | unverified | 公式ドキュメントで明確な記載を確認できず |
| 8 | Bluesky APIにはレート制限がある | verified | 公式ドキュメントで確認済 |

---

## 詳細検証

### 主張1: BlueskyはAT Protocolというオープンなプロトコルを採用している

- **判定**: verified
- **根拠**: AT Protocol（Authenticated Transfer Protocol）は、Bluesky社が開発したオープンソースのソーシャルネットワーキングプロトコル。公式サイト（atproto.com）、Bluesky公式ドキュメント（docs.bsky.app）、Wikipedia、GitHubリポジトリ（bluesky-social/atproto）すべてで確認。2026年1月時点ではIETFでの標準化プロセスも進行中。
- **修正提案**: なし

**Sources**:
- [The AT Protocol | Bluesky](https://docs.bsky.app/docs/advanced-guides/atproto)
- [AT Protocol](https://atproto.com/)
- [AT Protocol - Wikipedia](https://en.wikipedia.org/wiki/AT_Protocol)

---

### 主張2: Bluesky APIはAPIキーの申請や審査が不要

- **判定**: verified
- **根拠**: Bluesky APIは従来のAPIキー申請や開発者登録を必要としない。公開エンドポイントは認証不要でアクセス可能。認証が必要な操作もアカウント情報（ハンドル＋アプリパスワード）で認証でき、X（旧Twitter）APIやThreads APIのような申請・審査プロセスは存在しない。
- **修正提案**: なし

**Sources**:
- [Get Started | Bluesky](https://docs.bsky.app/docs/get-started)
- [API Hosts and Auth | Bluesky](https://docs.bsky.app/docs/advanced-guides/api-directory)
- [Get started with Bluesky API and Python API | TheServerSide](https://www.theserverside.com/video/Get-started-with-Bluesky-API-and-Python-API)

---

### 主張3: アプリパスワード形式は xxxx-xxxx-xxxx-xxxx

- **判定**: verified
- **根拠**: Blueskyのアプリパスワードは「19文字の英数字とハイフンで構成されるxxxx-xxxx-xxxx-xxxx形式」であることが、公式エコシステムドキュメント（bluesky-social/atproto-ecosystem）およびFAQサイトで確認済。
- **修正提案**: なし

**Sources**:
- [atproto-ecosystem/app-passwords.md | GitHub](https://github.com/bluesky-social/atproto-ecosystem/blob/main/app-passwords.md)
- [Bluesky App Password FAQ](https://blueskyfeeds.com/faq-app-password)

---

### 主張4: BOTやCLIツールにはOAuth非推奨、アプリパスワード方式推奨（公式ドキュメントより）

- **判定**: verified
- **根拠**: Bluesky公式ブログの「OAuth for AT Protocol」記事で「OAuth is not currently recommended as an auth solution for "headless" clients, such as command-line tools or bots」と明記されている。BOT・CLIツール等のheadlessクライアントにはアプリパスワード方式が推奨されている。記事中の「公式ブログでも明記」という表現も正確。
- **修正提案**: なし

**Sources**:
- [OAuth for AT Protocol | Bluesky](https://docs.bsky.app/blog/oauth-atproto)
- [OAuth Client Implementation | Bluesky](https://docs.bsky.app/docs/advanced-guides/oauth-client)

---

### 主張5: アプリパスワードではアカウント設定（パスワード変更やアカウント削除）を変更できない

- **判定**: verified
- **根拠**: 公式エコシステムドキュメントに「App passwords have most of the same abilities as the user's account password, but they're restricted from destructive actions such as account deletion or account migration. They are also restricted from creating additional app passwords.」と記載。ただし記事中の「パスワードの変更」は公式ドキュメントで明示的に列挙されていない。公式が明示するのは「アカウント削除」「アカウント移行」「追加アプリパスワード作成」の制限。
- **修正提案**: 「パスワードの変更やアカウントの削除」→「アカウントの削除やアカウントの移行」に修正するとより正確。もしくは「パスワードの変更」も制限対象であることを別途確認のうえ記載を維持。

**Sources**:
- [atproto-ecosystem/app-passwords.md | GitHub](https://github.com/bluesky-social/atproto-ecosystem/blob/main/app-passwords.md)
- [Bluesky App Password FAQ](https://blueskyfeeds.com/faq-app-password)

---

### 主張6: Bluesky APIは完全無料

- **判定**: verified
- **根拠**: Bluesky APIは完全無料で利用可能。公式ドキュメントでも開発者登録やAPIキーの取得が不要であり、有料プランの記載はない。X（旧Twitter）APIが有料化したこととは対照的に、Blueskyは無料でAPIアクセスを提供している。
- **修正提案**: なし（ただし将来的な料金体系変更の可能性は常にあるため「2026年3月時点で」等の時点注記があるとより正確）

**Sources**:
- [Bluesky Documentation | Bluesky](https://docs.bsky.app/)
- [Bluesky API | Zuplo Learning Center](https://zuplo.com/learning-center/bluesky-api)

---

### 主張7: アプリパスワード名には英数字・スペース・ハイフン・アンダースコアのみ使用可能

- **判定**: unverified
- **根拠**: 複数のWebSearchを実施したが、アプリパスワードの「名前」に使用できる文字種を明記した公式ドキュメントを発見できなかった。UIの実際の挙動としてこの制限が存在する可能性は高いが、公式な裏付けが確認できない。com.atproto.server.createAppPassword のAPIドキュメントやLexicon定義にも名前フィールドの文字制限に関する明確な記載は見つからなかった。
- **修正提案**: 実際のBluesky UIで動作確認済みであれば記載を維持して問題ない。ただし、公式ドキュメントへのリンクで裏付けることは現時点で困難。

**Sources**:
- [com.atproto.server.createAppPassword | Bluesky](https://docs.bsky.app/docs/api/com-atproto-server-create-app-password)

---

### 主張8: Bluesky APIにはレート制限がある

- **判定**: verified
- **根拠**: Bluesky公式ドキュメントにRate Limitsの専用ページが存在。レート制限は1時間あたり5,000ポイント、1日あたり35,000ポイントと明記。HTTP 429レスポンスで制限通知。記事中でレート制限ページへのリンク（docs.bsky.app/docs/advanced-guides/rate-limits）も正しい。
- **修正提案**: なし

**Sources**:
- [Rate Limits | Bluesky](https://docs.bsky.app/docs/advanced-guides/rate-limits)
- [Rate Limits, PDS Distribution v3, and More | Bluesky](https://docs.bsky.app/blog/rate-limits-pds-v3)

---

## 総合評価

**overallVerdict: PASS**

8件の事実主張のうち7件がverified、1件がunverified（公式ドキュメントで裏付けが確認できないのみで、誤りではない）。重大な事実誤認（disputed/outdated）は検出されなかった。

**修正推奨箇所（1件）**:
- 主張5: 「パスワードの変更やアカウントの削除」の表現について、公式が明記しているのは「アカウント削除」「アカウント移行」「追加アプリパスワード作成」の制限。「パスワード変更」が制限対象であることは公式ドキュメントで明示的に確認できなかったため、「アカウントの削除やアカウントの移行といった操作」に修正するとより正確。
