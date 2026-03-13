# ファクトチェック結果

**記事タイトル**: ツリー投稿対応版Bluesky予約自動投稿ツールご利用ガイド
**検証日**: 2026-03-13
**Overall Verdict**: MOSTLY VERIFIED (8件中 4件 verified、2件 disputed、2件 outdated)

---

## 検証結果サマリー

| # | 主張 | 判定 |
|---|------|------|
| 1 | 1投稿テキスト上限は300 graphemes | verified |
| 2 | ハッシュタグは1つあたり最大64 graphemes | verified |
| 3 | 画像対応形式はJPEG/PNG/WebP、1枚あたり1MB、最大4枚 | verified |
| 4 | 動画対応形式はMP4のみ、最大3分、ファイルサイズ50MB以内 | disputed |
| 5 | 画像と動画を同じ投稿に含めることはできない | verified |
| 6 | APIレート制限: 5分あたり3,000リクエスト、コンテンツ書き込み1時間あたり5,000ポイント | outdated |
| 7 | 2000x2000pxを超える画像は自動リサイズされる | outdated |
| 8 | Bluesky APIは申請・審査・利用料金が不要 | verified |

---

## 個別検証

### 1. 1投稿テキスト上限は300 graphemes

**判定: verified**

AT Protocolの投稿スキーマ（`app.bsky.feed.post`）で `maxGraphemes: 300` および `maxLength: 3000`（UTF-8バイト上限）が定義されている。2026年3月時点でもこの制限は変更されていない。graphemeは人間が視覚的に認識する1文字単位であり、絵文字（例: 👨‍👩‍👧‍👦）も1 graphemeとしてカウントされる。

**情報源**:
- [BrandGhost - Bluesky Character Counter for Posts](https://blog.brandghost.ai/posts/bluesky-caption-character-counter/)
- [TypeCount - Bluesky Character Limit 2026](https://typecount.com/blog/bluesky-character-limit)
- [GitHub - atproto post.json lexicon](https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/feed/post.json)

---

### 2. ハッシュタグは1つあたり最大64 graphemes

**判定: verified**

AT Protocolのリッチテキストファセット定義（`app.bsky.richtext.facet`）において、ハッシュタグのtag propertyには `maxGraphemes: 64`、`maxLength: 640`（バイト）の制約が設定されている。この制限は `#` プレフィックスを除いたタグ本体に適用される。

**情報源**:
- [GitHub - atproto facet.json lexicon](https://github.com/bluesky-social/atproto/blob/main/lexicons/app/bsky/richtext/facet.json)
- [Bluesky公式ドキュメント - Links, mentions, and rich text](https://docs.bsky.app/docs/advanced-guides/post-richtext)

---

### 3. 画像対応形式はJPEG/PNG/WebP、1枚あたり1MB、最大4枚

**判定: verified**

Bluesky APIはJPEG、PNG、WebP（およびGIF）の画像形式を受け付ける。blob uploadのサイズ上限は1MB（1,000,000バイト）。1投稿あたり最大4枚の画像を添付可能。記事の記述（JPEG/PNG/WebP、1MB、4枚）はすべて正確。なお、GIFも技術的には受け付けるが、アニメーションGIFは非対応。

**情報源**:
- [Bluesky公式ドキュメント - Creating a post](https://docs.bsky.app/docs/tutorials/creating-a-post)
- [PostFast - BlueSky Post Size & Image Dimensions Guide](https://postfa.st/sizes/bluesky/posts)
- [Hypefury - Bluesky Image Sizes](https://hypefury.com/bluesky/bluesky-image-sizes/)
- [Bluesky公式ドキュメント - Posts](https://docs.bsky.app/docs/advanced-guides/posts)

---

### 4. 動画対応形式はMP4のみ、最大3分、ファイルサイズ50MB以内

**判定: disputed**

複数の点で記事の記述と実態が異なる。

- **対応形式**: MP4のみではなく、MP4・MOV・MPEG・WebM の4形式に対応している。
- **最大時間**: 3分（180秒）は正確。2025年3月のバージョン1.99で従来の1分から3分に拡大された。
- **ファイルサイズ**: 50MBではなく、**100MB**が現在の上限。バージョン1.99アップデートにより、1〜3分の動画は最大100MBまでアップロード可能。50MBは旧制限（1分以内の動画時代の上限）。

**推奨修正**: 「MP4/MOV/MPEG/WebM対応、最大3分、ファイルサイズ100MB以内」に修正すべき。

**情報源**:
- [PostFast - BlueSky Video Size & Specifications Guide](https://postfa.st/sizes/bluesky/video)
- [Bluesky公式ドキュメント - Uploading Video](https://docs.bsky.app/docs/tutorials/video)
- [Shacknews - Bluesky App Version 1.99](https://www.shacknews.com/article/143406/bluesky-app-version-199-patch-notes)
- [blueskytomp4.com - Bluesky Video Formats Explained](https://blueskytomp4.com/bluesky-video-formats-explained)

---

### 5. 画像と動画を同じ投稿に含めることはできない

**判定: verified**

Bluesky投稿の `embed` プロパティは union 型であり、`app.bsky.embed.images`、`app.bsky.embed.video`、`app.bsky.embed.external`、`app.bsky.embed.record`、`app.bsky.embed.recordWithMedia` のいずれか1つのみを指定できる。画像embed と 動画embed を同時に設定することはAPIの構造上不可能。「4枚の画像 または 1本の動画」が1投稿の上限。

**情報源**:
- [Bluesky公式ドキュメント - Posts](https://docs.bsky.app/docs/advanced-guides/posts)
- [Bluesky公式ドキュメント - @atproto/api v0.14.0 release notes](https://docs.bsky.app/blog/api-v0-14-0-release-notes)
- [SocialBee - Bluesky content guidelines](https://socialbee.com/blog/bluesky-content-guidelines/)

---

### 6. APIレート制限: 5分あたり3,000リクエスト、コンテンツ書き込み1時間あたり5,000ポイント

**判定: outdated**

記事の数値は2025年時点の公式ドキュメントと一致するが、Bluesky公式は「これらの制限は今後変更される可能性がある」と明記しており、変動の可能性がある値である。

- **IPベースのグローバルレート制限**: 5分あたり3,000リクエスト → 確認できた（現時点で有効）
- **レコード書き込み制限**: 1時間あたり5,000ポイント、1日あたり35,000ポイント → 確認できた（現時点で有効）

数値自体は現在も正確だが、公式が「変更の可能性あり」と注記しているため outdated リスクがある。読者には最新の公式ドキュメントの参照を促すべき。

**情報源**:
- [Bluesky公式ドキュメント - Rate Limits](https://docs.bsky.app/docs/advanced-guides/rate-limits)
- [Bluesky公式ブログ - Rate Limits, PDS Distribution v3, and More](https://docs.bsky.app/blog/rate-limits-pds-v3)

---

### 7. 2000x2000pxを超える画像は自動リサイズされる

**判定: outdated**

Blueskyが画像を2000x2000pxにリサイズすることは事実だが、記事の「2000x2000pxを超える画像は自動リサイズ」という記述は不正確。実際には、**サイズに関係なくすべてのアップロード画像が2000px（幅または高さの大きい方）にリサイズされ、JPEG圧縮が適用される**。つまり、2000px以下の画像でもリサイズ・圧縮される場合がある。また、一部のサードパーティツールや公式ドキュメントでは画像の推奨最大サイズを1000pxとする記述もあり、プラットフォームの挙動が変動している可能性がある。

**推奨修正**: 「アップロード画像は最大2000pxにリサイズされ、1MBを超える場合はJPEG圧縮が適用される」のように、より正確な表現に修正すべき。

**情報源**:
- [GitHub Issue #1101 - Image uploads are rescaled to 2000x2000](https://github.com/bluesky-social/social-app/issues/1101)
- [GitHub Discussion #2887 - Please consider raising the image resolution & file size limits](https://github.com/bluesky-social/atproto/discussions/2887)
- [Accio - Bluesky Image Sizes: Specs, Optimization, and Display Control Guide](https://www.accio.com/blog/bluesky-image-sizes-specs-optimization-and-display-control-guide)

---

### 8. Bluesky APIは申請・審査・利用料金が不要

**判定: verified**

Bluesky APIはAT Protocol上に構築されており、分散型プロトコルの設計上、中央集権的なAPI利用申請・審査プロセスは存在しない。APIドキュメントは公開されており、Blueskyアカウントがあれば認証エンドポイントを通じてすぐにAPI利用を開始できる。多くの公開エンドポイントは認証不要でアクセス可能。利用料金は不要。

**情報源**:
- [Bluesky公式ドキュメント - Get Started](https://docs.bsky.app/docs/get-started)
- [Bluesky公式ドキュメント - API Hosts and Auth](https://docs.bsky.app/docs/advanced-guides/api-directory)
- [GitHub - bluesky-social/atproto](https://github.com/bluesky-social/atproto)

---

## 総合所見

記事の技術的主張は概ね正確だが、以下2点に要修正箇所がある:

1. **動画仕様（主張4）**: MP4のみ→実際は4形式対応、50MB→実際は100MB。これは読者の実用に直接影響するため修正優先度が高い。
2. **画像リサイズ（主張7）**: 「超える場合のみリサイズ」ではなく、すべての画像がリサイズ対象となる挙動をより正確に記述すべき。

レート制限（主張6）は現時点では正確だが、公式が変更可能性を明記しているため、「最新の公式ドキュメントを参照してください」等の注記を付けることを推奨する。
