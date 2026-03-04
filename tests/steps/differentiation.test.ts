import { describe, it, expect, vi } from 'vitest';
import {
  buildDifferentiationPrompt,
  designDifferentiation,
} from '../../src/steps/differentiation.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildDifferentiationPrompt', () => {
  it('includes all previous analysis context', () => {
    const prompt = buildDifferentiationPrompt(
      { keyword: 'Docker 入門', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: ['実運用の知見不足'] },
      { readerSituation: '', readerAnxieties: ['難しそう'], decisionBarriers: [], desiredOutcomes: [] },
    );

    expect(prompt).toContain('Docker 入門');
    expect(prompt).toContain('実運用の知見不足');
    expect(prompt).toContain('難しそう');
    expect(prompt).toContain('構造化');
    expect(prompt).toContain('失敗パターン');
  });
});

describe('designDifferentiation', () => {
  it('calls Claude and returns Differentiation', async () => {
    const mockResponse = `\`\`\`json
{
  "differentiationPoints": [
    {"category": "構造化", "description": "チートシート形式で要点を整理"},
    {"category": "失敗パターン", "description": "初心者がハマりやすい3つの罠"}
  ],
  "uniqueValueProposition": "実務で即使えるDocker環境構築の完全マップ"
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await designDifferentiation(
      { keyword: '', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [] },
      { readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [] },
    );

    expect(result.differentiationPoints).toHaveLength(2);
    expect(result.uniqueValueProposition).toBeTruthy();
  });
});
