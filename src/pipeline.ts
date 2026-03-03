import { analyzeKeyword } from './agents/keywordAnalysis.js'
import { analyzeSeoTop } from './agents/seoAnalysis.js'
import { deepDiveIntent } from './agents/intentDeepDive.js'
import { designDifferentiation } from './agents/differentiationDesign.js'
import { createOutline } from './agents/outlineCreation.js'
import { generateAndPublish } from './agents/articleGeneration.js'
import type { WordPressPostResult, WordPressConfig } from './types/index.js'

export async function runPipeline(
  keyword: string,
  config: WordPressConfig,
): Promise<WordPressPostResult> {
  const step1 = await analyzeKeyword({ keyword })
  const step2 = await analyzeSeoTop(step1)
  const step3 = await deepDiveIntent(step2)
  const step4 = await designDifferentiation(step3)
  const step5 = await createOutline(step4)
  return generateAndPublish(step5, config)
}
