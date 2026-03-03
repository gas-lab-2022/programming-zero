import { callAgent } from '../infrastructure/claude.js'
import { searchWeb } from '../infrastructure/search.js'
import type { KeywordAnalysisOutput, SeoAnalysisOutput } from '../types/index.js'

const SYSTEM_PROMPT = `あなたはSEO分析の専門家です。
提供された上位記事のデータをもとに、共通構造・必須カバー項目・ギャップ機会を分析してください。`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    commonStructure: { type: 'array', items: { type: 'string' } },
    mustCoverTopics: { type: 'array', items: { type: 'string' } },
    gapOpportunities: { type: 'array', items: { type: 'string' } },
  },
  required: ['commonStructure', 'mustCoverTopics', 'gapOpportunities'],
}

export async function analyzeSeoTop(input: KeywordAnalysisOutput): Promise<SeoAnalysisOutput> {
  const articles = await searchWeb(input.searchQueries)

  const articlesSummary = articles
    .map((a) => `URL: ${a.url}\nタイトル: ${a.title}\n内容: ${a.content}`)
    .join('\n\n---\n\n')

  const newFields = await callAgent<
    Pick<SeoAnalysisOutput, 'commonStructure' | 'mustCoverTopics' | 'gapOpportunities'>
  >({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `キーワード「${input.keyword}」の上位記事を分析してください。

【キーワード分析結果】
- 表層意図: ${input.surfaceIntent}
- 潜在意図: ${input.latentIntent}
- 最終ゴール: ${input.finalGoal}

【上位記事データ】
${articlesSummary}`,
    outputSchema: OUTPUT_SCHEMA,
  })

  return { ...input, topArticles: articles, ...newFields }
}
