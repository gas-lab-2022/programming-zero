import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeKeyword } from '../src/agents/keywordAnalysis.js'
import { analyzeSeoTop } from '../src/agents/seoAnalysis.js'
import { deepDiveIntent } from '../src/agents/intentDeepDive.js'
import { designDifferentiation } from '../src/agents/differentiationDesign.js'
import { createOutline } from '../src/agents/outlineCreation.js'
import { generateAndPublish } from '../src/agents/articleGeneration.js'
import { runPipeline } from '../src/pipeline.js'
import type { WordPressConfig } from '../src/types/index.js'

vi.mock('../src/agents/keywordAnalysis.js')
vi.mock('../src/agents/seoAnalysis.js')
vi.mock('../src/agents/intentDeepDive.js')
vi.mock('../src/agents/differentiationDesign.js')
vi.mock('../src/agents/outlineCreation.js')
vi.mock('../src/agents/articleGeneration.js')

const mockAnalyzeKeyword = vi.mocked(analyzeKeyword)
const mockAnalyzeSeoTop = vi.mocked(analyzeSeoTop)
const mockDeepDiveIntent = vi.mocked(deepDiveIntent)
const mockDesignDifferentiation = vi.mocked(designDifferentiation)
const mockCreateOutline = vi.mocked(createOutline)
const mockGenerateAndPublish = vi.mocked(generateAndPublish)

const config: WordPressConfig = {
  siteUrl: 'https://programming-zero.net',
  username: 'admin',
  appPassword: 'test-app-password',
}

const step1 = {
  keyword: 'TypeScript 入門',
  surfaceIntent: 'learn',
  latentIntent: 'grow',
  finalGoal: 'build',
  searchQueries: ['query1'],
}
const step2 = { ...step1, topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [] }
const step3 = { ...step2, readerSituation: 'beginner', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [] }
const step4 = { ...step3, differentiationPoints: [], uniqueValueProposition: 'value' }
const step5 = { ...step4, title: 'Title', metaDescription: 'Meta', sections: [] }
const postResult = { id: 42, link: 'https://programming-zero.net/?p=42', status: 'draft' as const }

describe('runPipeline', () => {
  beforeEach(() => {
    mockAnalyzeKeyword.mockReset()
    mockAnalyzeSeoTop.mockReset()
    mockDeepDiveIntent.mockReset()
    mockDesignDifferentiation.mockReset()
    mockCreateOutline.mockReset()
    mockGenerateAndPublish.mockReset()

    mockAnalyzeKeyword.mockResolvedValue(step1)
    mockAnalyzeSeoTop.mockResolvedValue(step2)
    mockDeepDiveIntent.mockResolvedValue(step3)
    mockDesignDifferentiation.mockResolvedValue(step4)
    mockCreateOutline.mockResolvedValue(step5)
    mockGenerateAndPublish.mockResolvedValue(postResult)
  })

  it('should call all 6 agents in the correct order', async () => {
    // Given: all agents are mocked (set up in beforeEach)
    const callOrder: string[] = []
    mockAnalyzeKeyword.mockImplementation(async (input) => { callOrder.push('step1'); return step1 })
    mockAnalyzeSeoTop.mockImplementation(async () => { callOrder.push('step2'); return step2 })
    mockDeepDiveIntent.mockImplementation(async () => { callOrder.push('step3'); return step3 })
    mockDesignDifferentiation.mockImplementation(async () => { callOrder.push('step4'); return step4 })
    mockCreateOutline.mockImplementation(async () => { callOrder.push('step5'); return step5 })
    mockGenerateAndPublish.mockImplementation(async () => { callOrder.push('step6'); return postResult })

    // When: runPipeline is called
    await runPipeline('TypeScript 入門', config)

    // Then: all 6 steps are called in order
    expect(callOrder).toEqual(['step1', 'step2', 'step3', 'step4', 'step5', 'step6'])
  })

  it('should pass keyword to step1 (analyzeKeyword)', async () => {
    // Given: all agents are mocked (set up in beforeEach)

    // When: runPipeline is called with a keyword
    await runPipeline('React hooks', config)

    // Then: analyzeKeyword is called with the keyword
    expect(mockAnalyzeKeyword).toHaveBeenCalledWith({ keyword: 'React hooks' })
  })

  it('should pass step1 output to step2 (analyzeSeoTop)', async () => {
    // Given: step1 returns a specific output
    const customStep1 = { ...step1, keyword: 'React hooks', searchQueries: ['React hooks usage'] }
    mockAnalyzeKeyword.mockResolvedValue(customStep1)

    // When: runPipeline is called
    await runPipeline('React hooks', config)

    // Then: analyzeSeoTop receives step1's output
    expect(mockAnalyzeSeoTop).toHaveBeenCalledWith(customStep1)
  })

  it('should pass step2 output to step3 (deepDiveIntent)', async () => {
    // Given: step2 returns a specific output
    const customStep2 = { ...step2, gapOpportunities: ['custom gap'] }
    mockAnalyzeSeoTop.mockResolvedValue(customStep2)

    // When: runPipeline is called
    await runPipeline('TypeScript 入門', config)

    // Then: deepDiveIntent receives step2's output
    expect(mockDeepDiveIntent).toHaveBeenCalledWith(customStep2)
  })

  it('should pass step3 output to step4 (designDifferentiation)', async () => {
    // Given: step3 returns specific output
    const customStep3 = { ...step3, readerAnxieties: ['custom anxiety'] }
    mockDeepDiveIntent.mockResolvedValue(customStep3)

    // When: runPipeline is called
    await runPipeline('TypeScript 入門', config)

    // Then: designDifferentiation receives step3's output
    expect(mockDesignDifferentiation).toHaveBeenCalledWith(customStep3)
  })

  it('should pass step4 output to step5 (createOutline)', async () => {
    // Given: step4 returns specific output
    const customStep4 = { ...step4, uniqueValueProposition: 'custom value' }
    mockDesignDifferentiation.mockResolvedValue(customStep4)

    // When: runPipeline is called
    await runPipeline('TypeScript 入門', config)

    // Then: createOutline receives step4's output
    expect(mockCreateOutline).toHaveBeenCalledWith(customStep4)
  })

  it('should pass step5 output to step6 (generateAndPublish)', async () => {
    // Given: step5 returns specific output
    const customStep5 = { ...step5, title: 'Custom Title' }
    mockCreateOutline.mockResolvedValue(customStep5)

    // When: runPipeline is called
    await runPipeline('TypeScript 入門', config)

    // Then: generateAndPublish receives step5's output and the config
    expect(mockGenerateAndPublish).toHaveBeenCalledWith(customStep5, config)
  })

  it('should return the WordPressPostResult from step6', async () => {
    // Given: all agents are mocked (set up in beforeEach)

    // When: runPipeline is called
    const result = await runPipeline('TypeScript 入門', config)

    // Then: returns the WordPress post result
    expect(result).toEqual(postResult)
  })

  it('should propagate errors from any step', async () => {
    // Given: step3 throws an error
    mockDeepDiveIntent.mockRejectedValue(new Error('Agent returned no result at step3'))

    // When / Then: the error propagates out of runPipeline
    await expect(runPipeline('TypeScript 入門', config)).rejects.toThrow('Agent returned no result at step3')
  })
})
