import { describe, it, expect, vi, beforeEach } from 'vitest'
import { publishPost } from '../../src/infrastructure/wordpress.js'
import type { ArticleContent, WordPressConfig } from '../../src/types/index.js'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const config: WordPressConfig = {
  siteUrl: 'https://programming-zero.net',
  username: 'admin',
  appPassword: 'abcd efgh ijkl mnop',
}

const content: ArticleContent = {
  title: 'TypeScript入門ガイド',
  htmlContent: '<h2>はじめに</h2><p>TypeScriptは...</p>',
  slug: 'typescript-introduction',
  excerpt: 'TypeScriptの基礎を解説します',
  tags: ['typescript', 'programming'],
}

describe('publishPost', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should publish post with draft status', async () => {
    // Given: tag searches find existing tags, and post creation succeeds
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'typescript' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 2, name: 'programming' }]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' }),
      )

    // When: publishPost is called
    const result = await publishPost(content, config)

    // Then: returns the post result with draft status
    expect(result).toEqual({
      id: 99,
      link: 'https://programming-zero.net/?p=99',
      status: 'draft',
    })
  })

  it('should use Basic Auth header with base64-encoded credentials', async () => {
    // Given: all API calls succeed
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'typescript' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 2, name: 'programming' }]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' }),
      )

    // When: publishPost is called
    await publishPost(content, config)

    // Then: the post creation request uses correct Basic Auth header
    const postCall = mockFetch.mock.calls.find((call: unknown[]) =>
      (call[0] as string).includes('/wp/v2/posts'),
    )
    expect(postCall).toBeDefined()
    const headers = (postCall![1] as RequestInit).headers as Record<string, string>
    const expectedToken = Buffer.from('admin:abcd efgh ijkl mnop').toString('base64')
    expect(headers['Authorization']).toBe(`Basic ${expectedToken}`)
  })

  it('should search for existing tags before creating new ones', async () => {
    // Given: both tags already exist
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: 10, name: 'typescript' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 20, name: 'programming' }]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' }),
      )

    // When: publishPost is called
    await publishPost(content, config)

    // Then: only 3 fetch calls (2 tag searches + 1 post creation, no tag creation)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('should create a tag when it does not exist', async () => {
    // Given: 'typescript' tag does not exist, 'programming' does exist
    mockFetch
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 11, name: 'typescript' }))
      .mockResolvedValueOnce(jsonResponse([{ id: 20, name: 'programming' }]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' }),
      )

    // When: publishPost is called
    await publishPost(content, config)

    // Then: 4 fetch calls (search, create, search, post)
    expect(mockFetch).toHaveBeenCalledTimes(4)

    // And: the tag creation call uses POST to /wp/v2/tags
    const tagCreateCall = mockFetch.mock.calls.find(
      (call: unknown[]) =>
        (call[0] as string).includes('/wp/v2/tags') &&
        (call[1] as RequestInit).method === 'POST',
    )
    expect(tagCreateCall).toBeDefined()
  })

  it('should throw when post creation returns non-ok response', async () => {
    // Given: tags resolve but post creation returns 403
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'typescript' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 2, name: 'programming' }]))
      .mockResolvedValueOnce(errorResponse(403, 'rest_forbidden'))

    // When / Then: throws an error
    await expect(publishPost(content, config)).rejects.toThrow()
  })

  it('should throw with "WordPress tag search failed" when tag search returns non-ok response', async () => {
    // Given: the first tag search returns 401 Unauthorized
    mockFetch.mockResolvedValueOnce(errorResponse(401, 'Unauthorized'))

    // When / Then: throws with the tag search error message
    await expect(publishPost(content, config)).rejects.toThrow('WordPress tag search failed')
  })

  it('should throw with "WordPress tag creation failed" when tag creation returns non-ok response', async () => {
    // Given: tag search finds nothing (empty array), then tag creation returns 403
    mockFetch
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(errorResponse(403, 'rest_cannot_create'))

    // When / Then: throws with the tag creation error message
    await expect(publishPost(content, config)).rejects.toThrow('WordPress tag creation failed')
  })

  it('should send post body including title, content, slug, and excerpt', async () => {
    // Given: all calls succeed
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'typescript' }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 2, name: 'programming' }]))
      .mockResolvedValueOnce(
        jsonResponse({ id: 99, link: 'https://programming-zero.net/?p=99', status: 'draft' }),
      )

    // When: publishPost is called
    await publishPost(content, config)

    // Then: the post creation call includes article fields
    const postCall = mockFetch.mock.calls.find((call: unknown[]) =>
      (call[0] as string).includes('/wp/v2/posts'),
    )
    const body = JSON.parse((postCall![1] as RequestInit).body as string) as Record<string, unknown>
    expect(body['title']).toBe('TypeScript入門ガイド')
    expect(body['content']).toBe('<h2>はじめに</h2><p>TypeScriptは...</p>')
    expect(body['slug']).toBe('typescript-introduction')
    expect(body['excerpt']).toBe('TypeScriptの基礎を解説します')
    expect(body['status']).toBe('draft')
  })
})

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response
}

function errorResponse(status: number, message: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ message }),
  } as Response
}
