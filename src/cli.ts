import 'dotenv/config';
import type { WpConfig } from './types.js';
import { runPipeline } from './pipeline.js';

export async function main(): Promise<void> {
  const keyword = process.argv[2];

  if (!keyword) {
    console.error('エラー: キーワードを指定してください。\n使い方: npm run generate -- "キーワード"');
    process.exit(1);
    return;
  }

  const requiredEnvVars = ['WP_SITE_URL', 'WP_USERNAME', 'WP_APP_PASSWORD'] as const;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`エラー: 環境変数 ${envVar} が設定されていません。.env ファイルを確認してください。`);
      process.exit(1);
      return;
    }
  }

  const config: WpConfig = {
    siteUrl: process.env.WP_SITE_URL!,
    username: process.env.WP_USERNAME!,
    appPassword: process.env.WP_APP_PASSWORD!,
  };

  try {
    console.log(`記事生成を開始: "${keyword}"\n`);
    const result = await runPipeline(keyword, config);
    console.log(`\n記事を下書き投稿しました`);
    console.log(`  投稿ID: ${result.id}`);
    console.log(`  URL: ${result.link}`);
    console.log(`  ステータス: ${result.status}`);
  } catch (error) {
    console.error('エラー:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Auto-invoke when run directly (not imported in tests)
const isDirectRun = process.argv[1]?.includes('cli');
if (isDirectRun) {
  main();
}
