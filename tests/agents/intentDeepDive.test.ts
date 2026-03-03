import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAgent } from '../../src/infrastructure/claude.js'
import { deepDiveIntent } from '../../src/agents/intentDeepDive.js'
import type { SeoAnalysisOutput } from '../../src/types/index.js'

vi.mock('../../src/infrastructure/claude.js')

const mockCallAgent = vi.mocked(callAgent)

const step2Output: SeoAnalysisOutput = {
  keyword: 'TypeScript 入門',
  surfaceIntent: 'learn TypeScript basics',
  latentIntent: 'improve programming skills',
  finalGoal: 'build TypeScript projects',
  searchQueries: ['TypeScript 入門'],
  topArticles: [{ url: 'https://example.com', title: 'TypeScript Guide', content: 'Content...' }],
  commonStructure: ['Introduction', 'Basics', 'Advanced'],
  mustCoverTopics: ['Type annotations', 'Interfaces'],
  gapOpportunities: ['Real-world examples'],
}

describe('deepDiveIntent', () => {
  beforeEach(() => {
    mockCallAgent.mockReset()
  })

  it('should return output with all required reader analysis fields', async () => {
    // Given: callAgent returns deep dive analysis
    mockCallAgent.mockResolvedValue({
      ...step2Output,
      readerSituation: 'プログラミング初心者でJavaScriptは少し書いたことがある',
      readerAnxieties: ['型が複雑で理解できるか不安', '学習コストが高そう'],
      decisionBarriers: ['どこから始めればいいかわからない', '実践的な例が少ない'],
      desiredOutcomes: ['TypeScriptでコードを書けるようになる', '型エラーを理解できる'],
    })

    // When: deepDiveIntent is called
    const result = await deepDiveIntent(step2Output)

    // Then: returns all reader analysis fields
    expect(result.readerSituation).toBeTruthy()
    expect(result.readerAnxieties).toBeInstanceOf(Array)
    expect(result.readerAnxieties.length).toBeGreaterThan(0)
    expect(result.decisionBarriers).toBeInstanceOf(Array)
    expect(result.desiredOutcomes).toBeInstanceOf(Array)
  })

  it('should preserve all fields from step2 output', async () => {
    // Given: callAgent returns output with step2 fields preserved
    mockCallAgent.mockResolvedValue({
      ...step2Output,
      readerSituation: 'some situation',
      readerAnxieties: ['anxiety1'],
      decisionBarriers: ['barrier1'],
      desiredOutcomes: ['outcome1'],
    })

    // When: deepDiveIntent is called
    const result = await deepDiveIntent(step2Output)

    // Then: all step2 fields are present in result
    expect(result.keyword).toBe(step2Output.keyword)
    expect(result.topArticles).toEqual(step2Output.topArticles)
    expect(result.commonStructure).toEqual(step2Output.commonStructure)
    expect(result.mustCoverTopics).toEqual(step2Output.mustCoverTopics)
    expect(result.gapOpportunities).toEqual(step2Output.gapOpportunities)
  })

  it('should include SEO analysis context in the user prompt', async () => {
    // Given: mocked callAgent
    mockCallAgent.mockResolvedValue({
      ...step2Output,
      readerSituation: 'situation',
      readerAnxieties: [],
      decisionBarriers: [],
      desiredOutcomes: [],
    })

    // When: deepDiveIntent is called
    await deepDiveIntent(step2Output)

    // Then: the user prompt contains keyword context
    const calledWith = mockCallAgent.mock.calls[0]![0]
    expect(calledWith.userPrompt).toContain(step2Output.keyword)
  })
})
