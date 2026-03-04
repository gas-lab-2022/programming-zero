import type { WpConfig, WpPostResult } from './types.js';
import { fetchRecentPosts, publishPost } from './utils/wordpress.js';
import { stripHtml } from './utils/html.js';
import { analyzeStyle } from './steps/styleAnalysis.js';
import { analyzeKeyword } from './steps/keywordAnalysis.js';
import { analyzeSeo } from './steps/seoAnalysis.js';
import { deepDiveIntent } from './steps/intentDeepDive.js';
import { designDifferentiation } from './steps/differentiation.js';
import { createOutline } from './steps/outline.js';
import { generateArticle } from './steps/articleGeneration.js';

export async function runPipeline(keyword: string, config: WpConfig): Promise<WpPostResult> {
  // Step 0: Fetch existing articles and analyze writing style
  console.log('[Step 0] 既存記事のスタイルを分析中...');
  const posts = await fetchRecentPosts(config, 5);
  const articles = posts.map((p) => ({
    title: p.title.rendered,
    content: stripHtml(p.content.rendered),
  }));
  const styleProfile = await analyzeStyle(articles);
  console.log('[Step 0] 完了: StyleProfile取得');

  // Step 1: Keyword analysis
  console.log('[Step 1] キーワード構造を分析中...');
  const keywordAnalysis = await analyzeKeyword(keyword);
  console.log('[Step 1] 完了: 検索意図の3段階仮説');

  // Step 2: SEO top article analysis
  console.log('[Step 2] SEO上位記事を分析中...');
  const seoAnalysis = await analyzeSeo(keywordAnalysis);
  console.log(`[Step 2] 完了: ${seoAnalysis.topArticles.length}件の記事を分析`);

  // Step 3: Intent deep dive
  console.log('[Step 3] 検索意図を深掘り中...');
  const intentDeepDive = await deepDiveIntent(keywordAnalysis, seoAnalysis);
  console.log('[Step 3] 完了: 読者心理の分析');

  // Step 4: Differentiation design
  console.log('[Step 4] 差別化ポイントを設計中...');
  const differentiation = await designDifferentiation(keywordAnalysis, seoAnalysis, intentDeepDive);
  console.log('[Step 4] 完了: 差別化戦略');

  // Step 5: Outline creation
  console.log('[Step 5] 記事アウトラインを作成中...');
  const outline = await createOutline(
    keywordAnalysis,
    seoAnalysis,
    intentDeepDive,
    differentiation,
    styleProfile,
  );
  console.log(`[Step 5] 完了: "${outline.title}"`);

  // Step 6: Article generation
  console.log('[Step 6] 記事本文を生成中...');
  const article = await generateArticle(outline, styleProfile, keyword);
  console.log('[Step 6] 完了: HTML本文生成');

  // Publish to WordPress
  console.log('WordPress に下書き投稿中...');
  const result = await publishPost(article, config);
  console.log(`完了: 投稿ID=${result.id}, URL=${result.link}`);

  return result;
}
