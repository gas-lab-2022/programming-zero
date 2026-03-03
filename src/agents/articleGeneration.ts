import { callAgent } from '../infrastructure/claude.js'
import { publishPost } from '../infrastructure/wordpress.js'
import type { OutlineOutput, ArticleContent, WordPressPostResult, WordPressConfig } from '../types/index.js'

const SYSTEM_PROMPT = `あなたはプロのライターです。
提供されたアウトラインに基づき、「情報提供」ではなく「腹落ち・納得」を重視した記事を書いてください。
HTML形式で本文を生成し、見出しにはh2/h3タグを使用してください。`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    htmlContent: { type: 'string' },
    slug: { type: 'string' },
    excerpt: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'htmlContent', 'slug', 'excerpt', 'tags'],
}

export async function generateAndPublish(
  input: OutlineOutput,
  config: WordPressConfig,
): Promise<WordPressPostResult> {
  const sectionsSummary = input.sections
    .map((s) => `- ${s.heading}\n${s.subheadings.map((sh) => `  - ${sh}`).join('\n')}`)
    .join('\n')

  const articleContent = await callAgent<ArticleContent>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `以下のアウトラインに基づき、記事を生成してください。

【タイトル】
${input.title}

【セクション構成】
${sectionsSummary}

【ユニーク価値提案】
${input.uniqueValueProposition}`,
    outputSchema: OUTPUT_SCHEMA,
  })

  return publishPost(articleContent, config)
}
