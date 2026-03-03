import { callAgent } from '../infrastructure/claude.js'
import type { KeywordAnalysisInput, KeywordAnalysisOutput } from '../types/index.js'

const SYSTEM_PROMPT = `あなたはSEO戦略の専門家です。
キーワードを受け取り、検索意図を3段階（表層意図・潜在意図・最終ゴール）で分析してください。
また、SEOリサーチ用の検索クエリを3〜5個生成してください。`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    keyword: { type: 'string' },
    surfaceIntent: { type: 'string' },
    latentIntent: { type: 'string' },
    finalGoal: { type: 'string' },
    searchQueries: { type: 'array', items: { type: 'string' } },
  },
  required: ['keyword', 'surfaceIntent', 'latentIntent', 'finalGoal', 'searchQueries'],
}

export async function analyzeKeyword(input: KeywordAnalysisInput): Promise<KeywordAnalysisOutput> {
  return callAgent<KeywordAnalysisOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `キーワード「${input.keyword}」の検索意図を分析し、SEOリサーチ用クエリを生成してください。`,
    outputSchema: OUTPUT_SCHEMA,
  })
}
