import { describe, it, expect, vi } from 'vitest';
import { buildStyleAnalysisPrompt, analyzeStyle } from '../../src/steps/styleAnalysis.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildStyleAnalysisPrompt', () => {
  it('includes article content in the prompt', () => {
    const articles = [
      { title: 'テスト記事', content: 'これはテスト記事の内容です。' },
    ];
    const prompt = buildStyleAnalysisPrompt(articles);

    expect(prompt).toContain('テスト記事');
    expect(prompt).toContain('これはテスト記事の内容です。');
  });

  it('includes instructions for JSON output', () => {
    const prompt = buildStyleAnalysisPrompt([]);
    expect(prompt).toContain('```json');
    expect(prompt).toContain('writingStyle');
  });
});

describe('analyzeStyle', () => {
  it('calls Claude and returns parsed StyleProfile', async () => {
    const mockResponse = `分析結果です。
\`\`\`json
{
  "writingStyle": "丁寧で分かりやすい説明文体",
  "sentenceEndings": ["です", "ます", "でしょう"],
  "tone": "敬体（です・ます調）、親しみやすいトーン",
  "headingPattern": "H2で大テーマ、H3で具体的なトピック",
  "sectionStructure": "導入→問題提起→解説→具体例→まとめ"
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const articles = [{ title: 'Test', content: 'Content' }];
    const result = await analyzeStyle(articles);

    expect(result).toEqual({
      writingStyle: '丁寧で分かりやすい説明文体',
      sentenceEndings: ['です', 'ます', 'でしょう'],
      tone: '敬体（です・ます調）、親しみやすいトーン',
      headingPattern: 'H2で大テーマ、H3で具体的なトピック',
      sectionStructure: '導入→問題提起→解説→具体例→まとめ',
    });
  });
});
