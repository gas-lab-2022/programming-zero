import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tavily } from '@tavily/core'
import { searchWeb } from '../../src/infrastructure/search.js'

vi.mock('@tavily/core')

describe('searchWeb', () => {
  let mockSearch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSearch = vi.fn()
    vi.mocked(tavily).mockReturnValue({ search: mockSearch } as unknown as ReturnType<typeof tavily>)
  })

  it('should return ArticleSource array mapped from Tavily results', async () => {
    // Given: Tavily returns two search results
    mockSearch.mockResolvedValue({
      results: [
        { url: 'https://example.com/a', title: 'Article A', content: 'Content A' },
        { url: 'https://example.com/b', title: 'Article B', content: 'Content B' },
      ],
    })

    // When: searchWeb is called with one query
    const results = await searchWeb(['TypeScript入門'])

    // Then: returns ArticleSource array with correct fields
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      url: 'https://example.com/a',
      title: 'Article A',
      content: 'Content A',
    })
    expect(results[1]).toEqual({
      url: 'https://example.com/b',
      title: 'Article B',
      content: 'Content B',
    })
  })

  it('should use advanced search depth for higher quality results', async () => {
    // Given: empty results
    mockSearch.mockResolvedValue({ results: [] })

    // When: searchWeb is called
    await searchWeb(['some query'])

    // Then: Tavily search is called with searchDepth: 'advanced'
    expect(mockSearch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ searchDepth: 'advanced' }),
    )
  })

  it('should aggregate results from multiple queries', async () => {
    // Given: each query returns one result
    mockSearch
      .mockResolvedValueOnce({
        results: [{ url: 'https://a.com', title: 'A', content: 'Content A' }],
      })
      .mockResolvedValueOnce({
        results: [{ url: 'https://b.com', title: 'B', content: 'Content B' }],
      })

    // When: searchWeb is called with two queries
    const results = await searchWeb(['query1', 'query2'])

    // Then: results from all queries are aggregated
    expect(results.length).toBeGreaterThanOrEqual(2)
    expect(mockSearch).toHaveBeenCalledTimes(2)
  })

  it('should deduplicate results with the same URL across queries', async () => {
    // Given: the same URL appears in results from two different queries
    const duplicate = { url: 'https://shared.com', title: 'Shared', content: 'Content' }
    mockSearch
      .mockResolvedValueOnce({ results: [duplicate] })
      .mockResolvedValueOnce({ results: [duplicate, { url: 'https://other.com', title: 'Other', content: 'Other content' }] })

    // When: searchWeb is called with two queries
    const results = await searchWeb(['query1', 'query2'])

    // Then: the shared URL appears only once
    const urls = results.map((r) => r.url)
    const uniqueUrls = [...new Set(urls)]
    expect(urls).toHaveLength(uniqueUrls.length)
  })

  it('should return empty array when no results are found', async () => {
    // Given: Tavily returns empty results for all queries
    mockSearch.mockResolvedValue({ results: [] })

    // When: searchWeb is called
    const results = await searchWeb(['obscure query'])

    // Then: returns empty array
    expect(results).toEqual([])
  })

  it('should propagate Tavily API errors', async () => {
    // Given: Tavily search throws an error
    mockSearch.mockRejectedValue(new Error('Tavily API error: quota exceeded'))

    // When / Then: the error propagates
    await expect(searchWeb(['query'])).rejects.toThrow('Tavily API error')
  })
})
