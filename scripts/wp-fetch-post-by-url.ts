import 'dotenv/config';

interface WpPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  slug: string;
  link: string;
}

function extractSlug(url: string): string {
  const path = new URL(url).pathname;
  const slug = path.replace(/^\/|\/$/g, '').split('/').pop();
  if (!slug) {
    throw new Error(`Could not extract slug from URL: ${url}`);
  }
  return slug;
}

async function main() {
  const articleUrl = process.argv[2];
  if (!articleUrl) {
    console.error('Usage: npx tsx scripts/wp-fetch-post-by-url.ts <article-url>');
    process.exit(1);
  }

  const siteUrl = process.env.WP_SITE_URL;
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    console.error('Missing WP_SITE_URL, WP_USERNAME, or WP_APP_PASSWORD in .env');
    process.exit(1);
  }

  const slug = extractSlug(articleUrl);
  const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const url = `${siteUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) {
    console.error(`WordPress API error: ${response.status}`);
    process.exit(1);
  }

  const posts = (await response.json()) as WpPost[];

  if (posts.length === 0) {
    console.error(`No post found with slug: ${slug}`);
    process.exit(1);
  }

  const post = posts[0];
  const result = {
    id: post.id,
    title: post.title.rendered,
    content: post.content.rendered,
    slug: post.slug,
    link: post.link,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
