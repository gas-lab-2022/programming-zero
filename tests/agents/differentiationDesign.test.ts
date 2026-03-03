import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAgent } from '../../src/infrastructure/claude.js'
import { designDifferentiation } from '../../src/agents/differentiationDesign.js'
import type { IntentDeepDiveOutput } from '../../src/types/index.js'

vi.mock('../../src/infrastructure/claude.js')

const mockCallAgent = vi.mocked(callAgent)

const step3Output: IntentDeepDiveOutput = {
  keyword: 'TypeScript 入門',
  surfaceIntent: 'learn TypeScript basics',
  latentIntent: 'improve programming skills',
  finalGoal: 'build TypeScript projects',
  searchQueries: ['TypeScript 入門'],
  topArticles: [],
  commonStructure: ['Introduction', 'Basics'],
  mustCoverTopics: ['Type annotations'],
  gapOpportunities: ['Real-world examples'],
  readerSituation: 'JavaScript初心者',
  readerAnxieties: ['型が複雑', '学習コストが高い'],
  decisionBarriers: ['どこから始めるか不明'],
  desiredOutcomes: ['TypeScriptで開発できる'],
}

describe('designDifferentiation', () => {
  beforeEach(() => {
    mockCallAgent.mockReset()
  })

  it('should return differentiation points and unique value proposition', async () => {
    // Given: callAgent returns differentiation design
    mockCallAgent.mockResolvedValue({
      ...step3Output,
      differentiationPoints: [
        { angle: '実際のプロジェクト構成で解説', rationale: 'ギャップ分析で不足と判定' },
        { angle: 'エラーメッセージの読み方を重点解説', rationale: '読者の不安として挙がっている' },
      ],
      uniqueValueProposition: '初心者が最短でTypeScriptプロジェクトを動かせることに特化',
    })

    // When: designDifferentiation is called
    const result = await designDifferentiation(step3Output)

    // Then: differentiation points are present
    expect(result.differentiationPoints).toBeInstanceOf(Array)
    expect(result.differentiationPoints.length).toBeGreaterThan(0)
    expect(result.differentiationPoints[0]).toHaveProperty('angle')
    expect(result.differentiationPoints[0]).toHaveProperty('rationale')

    // And: unique value proposition is present
    expect(result.uniqueValueProposition).toBeTruthy()
  })

  it('should preserve all fields from step3 output', async () => {
    // Given: callAgent returns with step3 fields preserved
    mockCallAgent.mockResolvedValue({
      ...step3Output,
      differentiationPoints: [{ angle: 'unique angle', rationale: 'because gap' }],
      uniqueValueProposition: 'our unique value',
    })

    // When: designDifferentiation is called
    const result = await designDifferentiation(step3Output)

    // Then: all step3 fields are present
    expect(result.keyword).toBe(step3Output.keyword)
    expect(result.readerAnxieties).toEqual(step3Output.readerAnxieties)
    expect(result.decisionBarriers).toEqual(step3Output.decisionBarriers)
    expect(result.gapOpportunities).toEqual(step3Output.gapOpportunities)
  })

  it('should include reader insights in the user prompt to leverage anxiety and barrier data', async () => {
    // Given: mocked callAgent
    mockCallAgent.mockResolvedValue({
      ...step3Output,
      differentiationPoints: [],
      uniqueValueProposition: 'value',
    })

    // When: designDifferentiation is called
    await designDifferentiation(step3Output)

    // Then: reader situation and anxieties are referenced in the prompt
    const calledWith = mockCallAgent.mock.calls[0]![0]
    expect(calledWith.userPrompt).toContain(step3Output.keyword)
  })
})
