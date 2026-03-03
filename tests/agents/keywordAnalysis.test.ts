import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAgent } from '../../src/infrastructure/claude.js'
import { analyzeKeyword } from '../../src/agents/keywordAnalysis.js'

vi.mock('../../src/infrastructure/claude.js')

const mockCallAgent = vi.mocked(callAgent)

describe('analyzeKeyword', () => {
  beforeEach(() => {
    mockCallAgent.mockReset()
  })

  it('should return structured output with all required intent fields', async () => {
    // Given: callAgent returns a complete keyword analysis
    const agentOutput = {
      keyword: 'TypeScript 入門',
      surfaceIntent: 'TypeScriptの基本を学びたい',
      latentIntent: 'プログラミングスキルを向上させたい',
      finalGoal: 'TypeScriptを使った開発ができるようになる',
      searchQueries: ['TypeScript 入門 初心者', 'TypeScript 基礎 学習方法'],
    }
    mockCallAgent.mockResolvedValue(agentOutput)

    // When: analyzeKeyword is called
    const result = await analyzeKeyword({ keyword: 'TypeScript 入門' })

    // Then: returns the full structured output
    expect(result.keyword).toBe('TypeScript 入門')
    expect(result.surfaceIntent).toBeTruthy()
    expect(result.latentIntent).toBeTruthy()
    expect(result.finalGoal).toBeTruthy()
    expect(result.searchQueries).toBeInstanceOf(Array)
  })

  it('should generate multiple search queries (at least 3)', async () => {
    // Given: callAgent returns analysis with queries
    mockCallAgent.mockResolvedValue({
      keyword: 'TypeScript 入門',
      surfaceIntent: 'learn TypeScript',
      latentIntent: 'career growth',
      finalGoal: 'become developer',
      searchQueries: ['query1', 'query2', 'query3', 'query4'],
    })

    // When: analyzeKeyword is called
    const result = await analyzeKeyword({ keyword: 'TypeScript 入門' })

    // Then: generates at least 3 search queries for comprehensive SEO research
    expect(result.searchQueries.length).toBeGreaterThanOrEqual(3)
  })

  it('should pass the keyword in the user prompt to callAgent', async () => {
    // Given: mocked callAgent that captures arguments
    mockCallAgent.mockResolvedValue({
      keyword: 'React hooks',
      surfaceIntent: 'learn hooks',
      latentIntent: 'modernize React code',
      finalGoal: 'write idiomatic React',
      searchQueries: ['React hooks tutorial'],
    })

    // When: analyzeKeyword is called with a specific keyword
    await analyzeKeyword({ keyword: 'React hooks' })

    // Then: the keyword is included in the prompt passed to callAgent
    expect(mockCallAgent).toHaveBeenCalledOnce()
    const calledWith = mockCallAgent.mock.calls[0]![0]
    expect(calledWith.userPrompt).toContain('React hooks')
  })

  it('should propagate callAgent errors', async () => {
    // Given: callAgent throws an error
    mockCallAgent.mockRejectedValue(new Error('Agent returned no result'))

    // When / Then: the error propagates
    await expect(analyzeKeyword({ keyword: 'test' })).rejects.toThrow('Agent returned no result')
  })
})
