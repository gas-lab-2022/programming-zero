import { describe, it, expect, vi } from 'vitest';
import { buildKeywordAnalysisPrompt, analyzeKeyword } from '../../src/steps/keywordAnalysis.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildKeywordAnalysisPrompt', () => {
  it('includes the keyword in the prompt', () => {
    const prompt = buildKeywordAnalysisPrompt('TypeScript 入門');
    expect(prompt).toContain('TypeScript 入門');
  });

  it('includes 3-stage intent hypothesis instructions', () => {
    const prompt = buildKeywordAnalysisPrompt('test');
    expect(prompt).toContain('表層意図');
    expect(prompt).toContain('潜在意図');
    expect(prompt).toContain('最終ゴール');
  });
});

describe('analyzeKeyword', () => {
  it('calls Claude and returns KeywordAnalysis', async () => {
    const mockResponse = `\`\`\`json
{
  "keyword": "TypeScript 入門",
  "surfaceIntent": "TypeScriptの基本的な書き方を知りたい",
  "latentIntent": "JavaScriptからTypeScriptへ移行したい",
  "finalGoal": "型安全なコードを書けるようになりたい",
  "searchQueries": ["TypeScript 始め方", "TypeScript JavaScript 違い", "TypeScript 環境構築"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await analyzeKeyword('TypeScript 入門');

    expect(result.keyword).toBe('TypeScript 入門');
    expect(result.surfaceIntent).toBeTruthy();
    expect(result.searchQueries).toHaveLength(3);
  });
});
