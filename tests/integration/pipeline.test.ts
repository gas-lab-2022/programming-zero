/**
 * Integration tests for the full pipeline.
 * Mocks only the external boundaries: claude-agent-sdk, @tavily/core, and global fetch.
 * All internal TypeScript modules (agents, infrastructure adapters) execute for real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { query, type Query } from '@anthropic-ai/claude-agent-sdk'
import { tavily } from '@tavily/core'
import { runPipeline } from '../../src/pipeline.js'
import type { WordPressConfig } from '../../src/types/index.js'

vi.mock('@anthropic-ai/claude-agent-sdk')
vi.mock('@tavily/core')

const mockQuery = vi.mocked(query)
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Query extends AsyncGenerator but adds control methods irrelevant to tests.
function asQuery(gen: AsyncGenerator<unknown>): Query {
  return gen as unknown as Query
}

// ─── Fixture builders ─────────────────────────────────────────────────────────

// Each builder returns only the fields that Claude generates for that step.
// The pipeline layer is responsible for spreading prior step outputs.

function makeStep1Result() {
  return {
    keyword: 'TypeScript 入門',
    surfaceIntent: 'TypeScriptの基本を学びたい',
    latentIntent: 'プログラミングスキルを向上させたい',
    finalGoal: 'TypeScriptで開発できるようになる',
    searchQueries: ['TypeScript 入門 初心者', 'TypeScript 基礎 学習'],
  }
}

function makeStep2Result() {
  return {
    commonStructure: ['Introduction', 'Basics', 'Advanced'],
    mustCoverTopics: ['Type annotations', 'Interfaces', 'Generics'],
    gapOpportunities: ['Real-world examples'],
  }
}

function makeStep3Result() {
  return {
    readerSituation: 'JavaScript初心者',
    readerAnxieties: ['型の仕組みが理解できるか不安'],
    decisionBarriers: ['どこから始めればいいかわからない'],
    desiredOutcomes: ['TypeScriptでコードを書けるようになる'],
  }
}

function makeStep4Result() {
  return {
    differentiationPoints: [
      { angle: '実プロジェクト構成で解説', rationale: 'ギャップ分析で不足と判定' },
    ],
    uniqueValueProposition: '初心者が最短でTypeScriptプロジェクトを動かせる記事',
  }
}

function makeStep5Result() {
  return {
    title: '【2026年版】TypeScript入門：初心者が最短で動かせる完全ガイド',
    metaDescription: 'TypeScript初心者向けに、型の基礎から実プロジェクトまで解説します。',
    sections: [
      {
        heading: 'TypeScriptとは？JavaScriptと何が違うのか',
        subheadings: ['型安全とは何か'],
        keyPoints: ['型があることで何が嬉しいか'],
      },
    ],
  }
}

function makeArticleContent() {
  return {
    title: '【2026年版】TypeScript入門ガイド',
    htmlContent: '<h1>TypeScript入門</h1><p>TypeScriptとは静的型付けのJavaScript上位互換言語です。</p>',
    slug: 'typescript-introduction-2026',
    excerpt: 'TypeScriptの基礎から実プロジェクトまで解説します。',
    tags: ['typescript', 'javascript', '入門'],
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const config: WordPressConfig = {
  siteUrl: 'https://programming-zero.net',
  username: 'admin',
  appPassword: 'test-app-password',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('pipeline integration: keyword → WordPress post', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    mockFetch.mockReset()
  })

  it('should execute all 6 pipeline steps and return a WordPress post result', async () => {
    // Given: Claude agent returns different JSON for each of the 6 calls
    setupClaudeSequence([
      makeStep1Result(),
      makeStep2Result(),
      makeStep3Result(),
      makeStep4Result(),
      makeStep5Result(),
      makeArticleContent(),
    ])

    setupTavilyMock([
      { url: 'https://example.com', title: 'TypeScript Guide', content: 'Content...' },
    ])

    // tags: ['typescript', 'javascript', '入門']
    // 'typescript' and 'javascript' found, '入門' not found → created
    setupWordPressMocks([
      [{ id: 10, name: 'typescript' }],          // search 'typescript' → found
      [{ id: 11, name: 'javascript' }],          // search 'javascript' → found
      null,                                       // search '入門' → not found (→ [])
      { id: 12, name: '入門' },                  // create '入門' tag
      { id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' },
    ])

    // When: runPipeline is called with a keyword
    const result = await runPipeline('TypeScript 入門', config)

    // Then: returns a valid WordPressPostResult
    expect(result.id).toBeTypeOf('number')
    expect(result.link).toMatch(/^https?:\/\//)
    expect(result.status).toBe('draft')
  })

  it('should invoke Claude 6 times (once per pipeline stage)', async () => {
    // Given: Claude returns valid JSON for all 6 stages
    setupClaudeSequence([
      makeStep1Result(),
      makeStep2Result(),
      makeStep3Result(),
      makeStep4Result(),
      makeStep5Result(),
      makeArticleContent(),
    ])

    setupTavilyMock([{ url: 'https://example.com', title: 'Guide', content: 'Content' }])

    // tags: ['typescript', 'javascript', '入門'] — all found (3 searches + 1 post)
    setupWordPressMocks([
      [{ id: 1, name: 'typescript' }],
      [{ id: 2, name: 'javascript' }],
      [{ id: 3, name: '入門' }],
      { id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' },
    ])

    // When: runPipeline runs
    await runPipeline('TypeScript 入門', config)

    // Then: query was called exactly 6 times (one per step)
    expect(mockQuery).toHaveBeenCalledTimes(6)
  })

  it('should call Tavily search exactly once per query (only step2 uses web search)', async () => {
    // Given: full pipeline mocked with an explicit mockSearch to count calls
    const mockSearch = vi.fn().mockResolvedValue({
      results: [{ url: 'https://example.com', title: 'Guide', content: 'Content' }],
    })
    vi.mocked(tavily).mockReturnValue(
      { search: mockSearch } as unknown as ReturnType<typeof tavily>,
    )

    setupClaudeSequence([
      makeStep1Result(),
      makeStep2Result(),
      makeStep3Result(),
      makeStep4Result(),
      makeStep5Result(),
      makeArticleContent(),
    ])

    // tags: ['typescript', 'javascript', '入門'] — all found (3 searches + 1 post)
    setupWordPressMocks([
      [{ id: 1, name: 'typescript' }],
      [{ id: 2, name: 'javascript' }],
      [{ id: 3, name: '入門' }],
      { id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' },
    ])

    // When: runPipeline runs
    await runPipeline('TypeScript 入門', config)

    // Then: Tavily search was called once per search query from step1
    expect(mockSearch).toHaveBeenCalledTimes(makeStep1Result().searchQueries.length)
  })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupClaudeSequence(outputs: unknown[]): void {
  let callCount = 0
  mockQuery.mockImplementation(() => {
    const output = outputs[callCount++]
    return asQuery(
      (async function* () {
        yield { result: JSON.stringify(output) }
      })(),
    )
  })
}

function setupTavilyMock(articles: Array<{ url: string; title: string; content: string }>): void {
  const mockSearch = vi.fn().mockResolvedValue({ results: articles })
  vi.mocked(tavily).mockReturnValue(
    { search: mockSearch } as unknown as ReturnType<typeof tavily>,
  )
}

function setupWordPressMocks(responses: unknown[]): void {
  for (const response of responses) {
    const data = response === null ? [] : response
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => data })
  }
}
