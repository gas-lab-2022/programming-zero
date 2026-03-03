import { callAgent } from '../infrastructure/claude.js'
import type { DifferentiationOutput, OutlineOutput } from '../types/index.js'

const SYSTEM_PROMPT = `あなたは記事設計の専門家です。
差別化設計をもとに、共感→問題整理→本質解説→具体策→失敗例→結論の構造で記事アウトラインを作成してください。
タイトル・メタディスクリプション・各セクションの見出し・サブ見出し・キーポイントを含めてください。`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    metaDescription: { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          subheadings: { type: 'array', items: { type: 'string' } },
          keyPoints: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  required: ['title', 'metaDescription', 'sections'],
}

export async function createOutline(input: DifferentiationOutput): Promise<OutlineOutput> {
  const newFields = await callAgent<Pick<OutlineOutput, 'title' | 'metaDescription' | 'sections'>>(
    {
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `キーワード「${input.keyword}」の記事アウトラインを作成してください。

【差別化設計】
- ユニーク価値提案: ${input.uniqueValueProposition}
- 差別化ポイント: ${input.differentiationPoints.map((p) => p.angle).join(', ')}

【読者の最終ゴール】
${input.finalGoal}`,
      outputSchema: OUTPUT_SCHEMA,
    },
  )

  return { ...input, ...newFields }
}
