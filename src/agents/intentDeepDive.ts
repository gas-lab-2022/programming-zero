import { callAgent } from '../infrastructure/claude.js'
import type { SeoAnalysisOutput, IntentDeepDiveOutput } from '../types/index.js'

const SYSTEM_PROMPT = `あなたはユーザー心理の専門家です。
SEO分析データをもとに、読者の状況・不安・決断障壁・読後に望む結果を深掘りしてください。`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    readerSituation: { type: 'string' },
    readerAnxieties: { type: 'array', items: { type: 'string' } },
    decisionBarriers: { type: 'array', items: { type: 'string' } },
    desiredOutcomes: { type: 'array', items: { type: 'string' } },
  },
  required: ['readerSituation', 'readerAnxieties', 'decisionBarriers', 'desiredOutcomes'],
}

export async function deepDiveIntent(input: SeoAnalysisOutput): Promise<IntentDeepDiveOutput> {
  const newFields = await callAgent<
    Pick<
      IntentDeepDiveOutput,
      'readerSituation' | 'readerAnxieties' | 'decisionBarriers' | 'desiredOutcomes'
    >
  >({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `キーワード「${input.keyword}」の読者心理を深掘りしてください。

【キーワード分析】
- 表層意図: ${input.surfaceIntent}
- 潜在意図: ${input.latentIntent}
- 最終ゴール: ${input.finalGoal}

【SEO分析】
- 共通構造: ${input.commonStructure.join(', ')}
- 必須カバー項目: ${input.mustCoverTopics.join(', ')}
- ギャップ機会: ${input.gapOpportunities.join(', ')}`,
    outputSchema: OUTPUT_SCHEMA,
  })

  return { ...input, ...newFields }
}
