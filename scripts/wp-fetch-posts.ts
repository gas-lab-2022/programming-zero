import 'dotenv/config';

interface WpPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const siteUrl = process.env.WP_SITE_URL;
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    console.error('Missing WP_SITE_URL, WP_USERNAME, or WP_APP_PASSWORD in .env');
    process.exit(1);
  }

  const count = parseInt(process.argv[2] || '5', 10);
  const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const url = `${siteUrl}/wp-json/wp/v2/posts?per_page=${count}&orderby=date&order=desc`;

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) {
    console.error(`WordPress API error: ${response.status}`);
    process.exit(1);
  }

  const posts = (await response.json()) as WpPost[];
  const result = posts.map((p) => ({
    title: stripHtml(p.title.rendered),
    content: stripHtml(p.content.rendered),
  }));

  console.log(JSON.stringify(result, null, 2));
}

main();
