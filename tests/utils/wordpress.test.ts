import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRecentPosts, publishPost } from '../../src/utils/wordpress.js';
import type { WpConfig, ArticleContent } from '../../src/types.js';

const testConfig: WpConfig = {
  siteUrl: 'https://example.com',
  username: 'testuser',
  appPassword: 'test-pass',
};

describe('fetchRecentPosts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches recent posts from WordPress REST API', async () => {
    const mockPosts = [
      { id: 1, title: { rendered: 'Post 1' }, content: { rendered: '<p>Content</p>' }, excerpt: { rendered: '' }, link: 'https://example.com/post-1', date: '2026-01-01' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    });

    const posts = await fetchRecentPosts(testConfig, 5);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts?per_page=5&orderby=date&order=desc',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    expect(posts).toEqual(mockPosts);
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(fetchRecentPosts(testConfig)).rejects.toThrow('WordPress API error: 401');
  });
});

describe('publishPost', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a draft post via WordPress REST API', async () => {
    const article: ArticleContent = {
      title: 'Test Title',
      htmlContent: '<p>Test content</p>',
      metaDescription: 'Test description',
      tags: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 42, link: 'https://example.com/test', status: 'draft' }),
    });

    const result = await publishPost(article, testConfig);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    expect(result).toEqual({ id: 42, link: 'https://example.com/test', status: 'draft' });
  });

  it('sends status as draft', async () => {
    const article: ArticleContent = {
      title: 'Title',
      htmlContent: '<p>Body</p>',
      metaDescription: 'Desc',
      tags: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, link: '', status: 'draft' }),
    });

    await publishPost(article, testConfig);

    const callBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(callBody.status).toBe('draft');
    expect(callBody.title).toBe('Title');
    expect(callBody.content).toBe('<p>Body</p>');
    expect(callBody.excerpt).toBe('Desc');
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(
      publishPost({ title: '', htmlContent: '', metaDescription: '', tags: [] }, testConfig),
    ).rejects.toThrow('WordPress API error: 403');
  });
});
