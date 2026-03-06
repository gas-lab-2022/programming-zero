# THE THOR テーマ対応ガイド

THE THOR（FIT Inc.）テーマ固有のWordPress設定・API対応をまとめる。

## SEOフィールド

THE THORはテーマ組み込みのSEO機能を持ち、投稿編集画面に「SEO対策」メタボックスを表示する。
これらはWP REST APIには公開されず、XML-RPCまたはカスタムフィールド直接操作で設定する。

### カスタムフィールドキー

| 管理画面の表示 | メタキー | 説明 |
|---|---|---|
| title設定 | `titleName` | SEOタイトル（`<title>`タグ）。未入力時は「記事タイトル\|サイト名」が自動生成される |
| meta description設定 | `description` | メタディスクリプション。検索結果に表示される説明文 |
| meta robot設定 | `noindex`, `nofollow`, `nosnippet`, `noarchive` | robots メタタグ（チェックボックス） |

### .env 設定

THE THOR を使用する場合、`.env` に以下を追加:

```env
WP_SEO_METHOD=xmlrpc
WP_SEO_TITLE_KEY=titleName
WP_SEO_DESC_KEY=description
```

これにより `wp-publish-draft.ts` / `wp-update-post.ts` が投稿後に XML-RPC で SEO フィールドを自動設定する。
`WP_SEO_METHOD` が未設定または `none` の場合はスキップされるため、他テーマでも安全。

### CLI

```bash
npx tsx scripts/wp-set-seo-fields.ts <postId> [seoTitle] [metaDescription]
```

### パイプライン統合

article.json の `seoTitle` と `metaDescription` が使用される:
- `seoTitle`: THE THORの「title設定」に反映。省略時はテーマが自動生成
- `metaDescription`: THE THORの「meta description設定」に反映

## title設定の運用ルール

- 投稿タイトルとSEOタイトルが同じなら `seoTitle` は省略可（テーマが自動生成）
- 投稿タイトルが長い場合やKWの並びを変えたい場合に `seoTitle` を明示的に設定
- テーマは未入力時に「記事タイトル|Programming ZERO」形式で自動出力。サイト名付与が不要なら明示的に設定する

## 既知の制限

- REST APIで `show_in_rest` に登録されていないため、REST APIの `meta` フィールドでは読み書き不可
- XML-RPCが無効化されている環境では動作しない
- robots メタタグ（noindex等）は現在パイプライン未対応（必要になれば追加）
