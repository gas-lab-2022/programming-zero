import { callAgent } from '../infrastructure/claude.js'
import type { IntentDeepDiveOutput, DifferentiationOutput } from '../types/index.js'

const SYSTEM_PROMPT = `あなたはコンテンツ戦略の専門家です。
読者心理とSEOギャップ分析をもとに、上位記事を超える差別化ポイントを設計してください。
構造化・データ・因果説明・失敗パターンの4軸で考えてください。`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    differentiationPoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          angle: { type: 'string' },
          rationale: { type: 'string' },
        },
      },
    },
    uniqueValueProposition: { type: 'string' },
  },
  required: ['differentiationPoints', 'uniqueValueProposition'],
}

export async function designDifferentiation(
  input: IntentDeepDiveOutput,
): Promise<DifferentiationOutput> {
  const newFields = await callAgent<
    Pick<DifferentiationOutput, 'differentiationPoints' | 'uniqueValueProposition'>
  >({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `キーワード「${input.keyword}」の記事差別化ポイントを設計してください。

【読者分析】
- 状況: ${input.readerSituation}
- 不安: ${input.readerAnxieties.join(', ')}
- 決断障壁: ${input.decisionBarriers.join(', ')}
- 望む結果: ${input.desiredOutcomes.join(', ')}

【SEOギャップ】
- ギャップ機会: ${input.gapOpportunities.join(', ')}`,
    outputSchema: OUTPUT_SCHEMA,
  })

  return { ...input, ...newFields }
}
