import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAgent } from '../../src/infrastructure/claude.js'
import { publishPost } from '../../src/infrastructure/wordpress.js'
import { generateAndPublish } from '../../src/agents/articleGeneration.js'
import type { OutlineOutput, WordPressConfig } from '../../src/types/index.js'

vi.mock('../../src/infrastructure/claude.js')
vi.mock('../../src/infrastructure/wordpress.js')

const mockCallAgent = vi.mocked(callAgent)
const mockPublishPost = vi.mocked(publishPost)

const config: WordPressConfig = {
  siteUrl: 'https://programming-zero.net',
  username: 'admin',
  appPassword: 'test-app-password',
}

const step5Output: OutlineOutput = {
  keyword: 'TypeScript 入門',
  surfaceIntent: 'learn basics',
  latentIntent: 'improve skills',
  finalGoal: 'build projects',
  searchQueries: ['TypeScript 入門'],
  topArticles: [],
  commonStructure: ['Introduction'],
  mustCoverTopics: ['Types'],
  gapOpportunities: ['Examples'],
  readerSituation: 'JavaScript初心者',
  readerAnxieties: ['型が難しい'],
  decisionBarriers: ['どこから始めるか'],
  desiredOutcomes: ['TypeScriptで開発'],
  differentiationPoints: [{ angle: 'プロジェクト構成で解説', rationale: 'ギャップ分析' }],
  uniqueValueProposition: '最短で動かせる',
  title: '【2026年版】TypeScript入門ガイド',
  metaDescription: 'TypeScript初心者向け完全ガイド',
  sections: [
    {
      heading: 'TypeScriptとは',
      subheadings: ['型安全とは'],
      keyPoints: ['型のメリット'],
    },
  ],
}

describe('generateAndPublish', () => {
  beforeEach(() => {
    mockCallAgent.mockReset()
    mockPublishPost.mockReset()
  })

  it('should call callAgent to generate article content from the outline', async () => {
    // Given: callAgent returns article content and publishPost succeeds
    mockCallAgent.mockResolvedValue({
      title: '【2026年版】TypeScript入門ガイド',
      htmlContent: '<h1>TypeScript入門</h1><p>TypeScriptとは...</p>',
      slug: 'typescript-introduction-2026',
      excerpt: 'TypeScriptの基礎から実践まで解説',
      tags: ['typescript', 'javascript', '入門'],
    })
    mockPublishPost.mockResolvedValue({
      id: 42,
      link: 'https://programming-zero.net/?p=42',
      status: 'draft',
    })

    // When: generateAndPublish is called
    await generateAndPublish(step5Output, config)

    // Then: callAgent was called to generate content
    expect(mockCallAgent).toHaveBeenCalledOnce()
    const calledWith = mockCallAgent.mock.calls[0]![0]
    expect(calledWith.userPrompt).toContain(step5Output.title)
  })

  it('should publish the generated content to WordPress', async () => {
    // Given: content generation succeeds
    const generatedContent = {
      title: '【2026年版】TypeScript入門ガイド',
      htmlContent: '<p>Content here</p>',
      slug: 'typescript-guide',
      excerpt: 'excerpt',
      tags: ['typescript'],
    }
    mockCallAgent.mockResolvedValue(generatedContent)
    mockPublishPost.mockResolvedValue({
      id: 42,
      link: 'https://programming-zero.net/?p=42',
      status: 'draft',
    })

    // When: generateAndPublish is called
    await generateAndPublish(step5Output, config)

    // Then: publishPost was called with the generated content and correct config
    expect(mockPublishPost).toHaveBeenCalledOnce()
    const [content, receivedConfig] = mockPublishPost.mock.calls[0]!
    expect(content.htmlContent).toBe('<p>Content here</p>')
    expect(content.tags).toEqual(['typescript'])
    expect(receivedConfig).toEqual({
      siteUrl: 'https://programming-zero.net',
      username: 'admin',
      appPassword: 'test-app-password',
    })
  })

  it('should return the WordPress post result', async () => {
    // Given: both agent and publish succeed
    mockCallAgent.mockResolvedValue({
      title: 'Title',
      htmlContent: '<p>Content</p>',
      slug: 'title',
      excerpt: 'excerpt',
      tags: ['tag'],
    })
    mockPublishPost.mockResolvedValue({
      id: 55,
      link: 'https://programming-zero.net/?p=55',
      status: 'draft',
    })

    // When: generateAndPublish is called
    const result = await generateAndPublish(step5Output, config)

    // Then: returns the WordPress post result
    expect(result).toEqual({
      id: 55,
      link: 'https://programming-zero.net/?p=55',
      status: 'draft',
    })
  })

  it('should include outline sections in the prompt for accurate article generation', async () => {
    // Given: mocked dependencies
    mockCallAgent.mockResolvedValue({
      title: 'Title',
      htmlContent: '<p>Content</p>',
      slug: 'title',
      excerpt: 'excerpt',
      tags: [],
    })
    mockPublishPost.mockResolvedValue({ id: 1, link: 'https://example.com', status: 'draft' })

    // When: generateAndPublish is called
    await generateAndPublish(step5Output, config)

    // Then: the outline section headings are included in the prompt
    const calledWith = mockCallAgent.mock.calls[0]![0]
    expect(calledWith.userPrompt).toContain(step5Output.sections[0]!.heading)
  })

  it('should propagate errors from publishPost', async () => {
    // Given: article generation succeeds but publishing fails
    mockCallAgent.mockResolvedValue({
      title: 'Title',
      htmlContent: '<p>Content</p>',
      slug: 'title',
      excerpt: 'excerpt',
      tags: [],
    })
    mockPublishPost.mockRejectedValue(new Error('WordPress API error: 403 Forbidden'))

    // When / Then: the error propagates
    await expect(generateAndPublish(step5Output, config)).rejects.toThrow('WordPress API error')
  })
})
