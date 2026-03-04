import { describe, it, expect, vi } from 'vitest';
import {
  buildArticleGenerationPrompt,
  generateArticle,
} from '../../src/steps/articleGeneration.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildArticleGenerationPrompt', () => {
  it('includes outline and StyleProfile', () => {
    const prompt = buildArticleGenerationPrompt(
      {
        title: 'テスト記事',
        metaDescription: 'テスト',
        sections: [{ heading: 'セクション1', subheadings: ['小見出し'], keyPoints: ['ポイント'] }],
      },
      {
        writingStyle: '丁寧で分かりやすい',
        sentenceEndings: ['です', 'ます'],
        tone: '敬体',
        headingPattern: 'H2で大テーマ',
        sectionStructure: '導入→本題→まとめ',
      },
      'TypeScript 入門',
    );

    expect(prompt).toContain('テスト記事');
    expect(prompt).toContain('セクション1');
    expect(prompt).toContain('丁寧で分かりやすい');
    expect(prompt).toContain('です');
    expect(prompt).toContain('腹落ち');
  });
});

describe('generateArticle', () => {
  it('calls Claude and returns ArticleContent', async () => {
    const mockResponse = `\`\`\`json
{
  "title": "【初心者向け】TypeScript入門ガイド",
  "htmlContent": "<h2>TypeScriptとは</h2><p>TypeScriptは...</p>",
  "metaDescription": "TypeScriptの基本を解説",
  "tags": ["TypeScript", "プログラミング", "入門"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await generateArticle(
      { title: '', metaDescription: '', sections: [] },
      { writingStyle: '', sentenceEndings: [], tone: '', headingPattern: '', sectionStructure: '' },
      'TypeScript',
    );

    expect(result.title).toBeTruthy();
    expect(result.htmlContent).toContain('<h2>');
    expect(result.tags).toBeInstanceOf(Array);
  });
});
