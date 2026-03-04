import type { WpConfig, WpPost, WpPostResult, ArticleContent } from '../types.js';

function authHeader(config: WpConfig): string {
  const credentials = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function fetchRecentPosts(config: WpConfig, count: number = 5): Promise<WpPost[]> {
  const url = `${config.siteUrl}/wp-json/wp/v2/posts?per_page=${count}&orderby=date&order=desc`;
  const response = await fetch(url, {
    headers: {
      Authorization: authHeader(config),
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  return response.json() as Promise<WpPost[]>;
}

export async function publishPost(article: ArticleContent, config: WpConfig): Promise<WpPostResult> {
  const url = `${config.siteUrl}/wp-json/wp/v2/posts`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader(config),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: article.title,
      content: article.htmlContent,
      status: 'draft',
      excerpt: article.metaDescription,
    }),
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  return response.json() as Promise<WpPostResult>;
}
