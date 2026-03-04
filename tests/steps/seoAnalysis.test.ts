import { describe, it, expect, vi } from 'vitest';
import { buildSeoAnalysisPrompt, analyzeSeo } from '../../src/steps/seoAnalysis.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildSeoAnalysisPrompt', () => {
  it('includes keyword analysis context', () => {
    const keywordAnalysis = {
      keyword: 'TypeScript 入門',
      surfaceIntent: '基本を知りたい',
      latentIntent: '移行したい',
      finalGoal: '型安全に書きたい',
      searchQueries: ['TypeScript 始め方', 'TypeScript JavaScript 違い'],
    };
    const prompt = buildSeoAnalysisPrompt(keywordAnalysis);

    expect(prompt).toContain('TypeScript 入門');
    expect(prompt).toContain('TypeScript 始め方');
    expect(prompt).toContain('WebSearch');
  });
});

describe('analyzeSeo', () => {
  it('calls Claude with WebSearch allowed and returns SeoAnalysis', async () => {
    const mockResponse = `\`\`\`json
{
  "topArticles": [
    {"url": "https://example.com/ts-guide", "title": "TS入門ガイド", "summary": "基礎を網羅"}
  ],
  "commonStructure": ["環境構築", "基本構文", "型システム"],
  "mustCoverTopics": ["型定義", "インターフェース", "ジェネリクス"],
  "gapOpportunities": ["実務でのベストプラクティスが不足"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await analyzeSeo({
      keyword: 'TypeScript 入門',
      surfaceIntent: '',
      latentIntent: '',
      finalGoal: '',
      searchQueries: ['TypeScript 始め方'],
    });

    expect(claude.callClaude).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        allowedTools: expect.arrayContaining(['WebSearch', 'WebFetch']),
      }),
    );
    expect(result.topArticles).toHaveLength(1);
    expect(result.commonStructure).toContain('環境構築');
  });
});
