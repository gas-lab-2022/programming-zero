import { tavily } from '@tavily/core'
import type { ArticleSource } from '../types/index.js'

export async function searchWeb(queries: string[]): Promise<ArticleSource[]> {
  const client = tavily({ apiKey: process.env['TAVILY_API_KEY'] })
  const resultsByUrl = new Map<string, ArticleSource>()

  for (const q of queries) {
    const response = await client.search(q, { searchDepth: 'advanced' })
    for (const item of response.results) {
      if (!resultsByUrl.has(item.url)) {
        resultsByUrl.set(item.url, {
          url: item.url,
          title: item.title,
          content: item.content,
        })
      }
    }
  }

  return Array.from(resultsByUrl.values())
}
