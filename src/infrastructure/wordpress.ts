import type { ArticleContent, WordPressPostResult, WordPressConfig } from '../types/index.js'

interface WpTag {
  id: number
  name: string
}

function buildAuthHeader(config: WordPressConfig): string {
  const token = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64')
  return `Basic ${token}`
}

function apiUrl(config: WordPressConfig, path: string): string {
  return `${config.siteUrl}/wp-json${path}`
}

async function resolveTagId(tagName: string, config: WordPressConfig): Promise<number> {
  const authHeader = buildAuthHeader(config)
  const searchUrl = apiUrl(config, `/wp/v2/tags?search=${encodeURIComponent(tagName)}`)
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: authHeader },
  })
  if (!searchRes.ok) {
    const err = (await searchRes.json()) as { message?: string }
    throw new Error(`WordPress tag search failed: ${searchRes.status} ${err.message ?? ''}`)
  }
  const found = (await searchRes.json()) as WpTag[]

  if (Array.isArray(found) && found.length > 0) {
    return found[0]!.id
  }

  const createRes = await fetch(apiUrl(config, '/wp/v2/tags'), {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: tagName }),
  })
  if (!createRes.ok) {
    const err = (await createRes.json()) as { message?: string }
    throw new Error(`WordPress tag creation failed: ${createRes.status} ${err.message ?? ''}`)
  }
  const created = (await createRes.json()) as WpTag
  return created.id
}

export async function publishPost(
  content: ArticleContent,
  config: WordPressConfig,
): Promise<WordPressPostResult> {
  const authHeader = buildAuthHeader(config)

  const tagIds: number[] = []
  for (const tag of content.tags) {
    tagIds.push(await resolveTagId(tag, config))
  }

  const postRes = await fetch(apiUrl(config, '/wp/v2/posts'), {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: content.title,
      content: content.htmlContent,
      slug: content.slug,
      excerpt: content.excerpt,
      status: 'draft',
      tags: tagIds,
    }),
  })

  if (!postRes.ok) {
    const error = (await postRes.json()) as { message?: string }
    throw new Error(`WordPress API error: ${postRes.status} ${error.message ?? 'Unknown error'}`)
  }

  const post = (await postRes.json()) as WordPressPostResult
  return { id: post.id, link: post.link, status: post.status }
}
