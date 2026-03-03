import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAgent } from '../../src/infrastructure/claude.js'
import { searchWeb } from '../../src/infrastructure/search.js'
import { analyzeSeoTop } from '../../src/agents/seoAnalysis.js'
import type { KeywordAnalysisOutput, ArticleSource } from '../../src/types/index.js'

vi.mock('../../src/infrastructure/claude.js')
vi.mock('../../src/infrastructure/search.js')

const mockCallAgent = vi.mocked(callAgent)
const mockSearchWeb = vi.mocked(searchWeb)

const step1Output: KeywordAnalysisOutput = {
  keyword: 'TypeScript 入門',
  surfaceIntent: 'learn TypeScript basics',
  latentIntent: 'improve programming skills',
  finalGoal: 'build TypeScript projects',
  searchQueries: ['TypeScript 入門 初心者', 'TypeScript 基礎 チュートリアル', 'TypeScript 学習 方法'],
}

const mockArticles: ArticleSource[] = [
  { url: 'https://example.com/1', title: 'TypeScript入門', content: 'TypeScriptとは...' },
  { url: 'https://example.com/2', title: 'TypeScript基礎', content: 'TypeScriptの基礎...' },
]

describe('analyzeSeoTop', () => {
  beforeEach(() => {
    mockCallAgent.mockReset()
    mockSearchWeb.mockReset()
  })

  it('should call searchWeb with queries from step1 output', async () => {
    // Given: search and agent both return valid data
    mockSearchWeb.mockResolvedValue(mockArticles)
    mockCallAgent.mockResolvedValue({
      ...step1Output,
      topArticles: mockArticles,
      commonStructure: ['Introduction', 'Basics'],
      mustCoverTopics: ['Type annotations', 'Interfaces'],
      gapOpportunities: ['Real-world examples'],
    })

    // When: analyzeSeoTop is called
    await analyzeSeoTop(step1Output)

    // Then: searchWeb is called with the exact queries from step1
    expect(mockSearchWeb).toHaveBeenCalledWith(step1Output.searchQueries)
  })

  it('should include search results in the prompt passed to callAgent', async () => {
    // Given: searchWeb returns articles
    mockSearchWeb.mockResolvedValue(mockArticles)
    mockCallAgent.mockResolvedValue({
      ...step1Output,
      topArticles: mockArticles,
      commonStructure: ['Introduction'],
      mustCoverTopics: ['Types'],
      gapOpportunities: ['Examples'],
    })

    // When: analyzeSeoTop is called
    await analyzeSeoTop(step1Output)

    // Then: callAgent is called with the article contents in the prompt
    const calledWith = mockCallAgent.mock.calls[0]![0]
    expect(calledWith.userPrompt).toContain(mockArticles[0]!.url)
  })

  it('should return output that includes all fields from step1 plus SEO analysis', async () => {
    // Given: search and agent return valid data
    mockSearchWeb.mockResolvedValue(mockArticles)
    const seoOutput = {
      ...step1Output,
      topArticles: mockArticles,
      commonStructure: ['Introduction', 'Getting Started', 'Advanced'],
      mustCoverTopics: ['Type annotations', 'Interfaces', 'Generics'],
      gapOpportunities: ['Real-world project examples', 'Error handling patterns'],
    }
    mockCallAgent.mockResolvedValue(seoOutput)

    // When: analyzeSeoTop is called
    const result = await analyzeSeoTop(step1Output)

    // Then: result includes all step1 fields
    expect(result.keyword).toBe(step1Output.keyword)
    expect(result.surfaceIntent).toBe(step1Output.surfaceIntent)
    expect(result.searchQueries).toEqual(step1Output.searchQueries)

    // And: SEO analysis fields are present
    expect(result.topArticles).toEqual(mockArticles)
    expect(result.commonStructure).toBeInstanceOf(Array)
    expect(result.mustCoverTopics).toBeInstanceOf(Array)
    expect(result.gapOpportunities).toBeInstanceOf(Array)
  })

  it('should propagate searchWeb errors', async () => {
    // Given: searchWeb throws
    mockSearchWeb.mockRejectedValue(new Error('Tavily quota exceeded'))

    // When / Then: error propagates
    await expect(analyzeSeoTop(step1Output)).rejects.toThrow('Tavily quota exceeded')
  })
})
