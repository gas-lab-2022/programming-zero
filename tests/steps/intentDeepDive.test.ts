import { describe, it, expect, vi } from 'vitest';
import { buildIntentDeepDivePrompt, deepDiveIntent } from '../../src/steps/intentDeepDive.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildIntentDeepDivePrompt', () => {
  it('includes keyword analysis and SEO analysis context', () => {
    const prompt = buildIntentDeepDivePrompt(
      {
        keyword: 'React hooks',
        surfaceIntent: 'hooksの使い方',
        latentIntent: 'クラスコンポーネントから移行',
        finalGoal: 'モダンReact開発',
        searchQueries: [],
      },
      {
        topArticles: [],
        commonStructure: ['useState解説', 'useEffect解説'],
        mustCoverTopics: ['カスタムフック'],
        gapOpportunities: ['パフォーマンス最適化'],
      },
    );

    expect(prompt).toContain('React hooks');
    expect(prompt).toContain('useState解説');
    expect(prompt).toContain('読者の状況');
  });
});

describe('deepDiveIntent', () => {
  it('calls Claude and returns IntentDeepDive', async () => {
    const mockResponse = `\`\`\`json
{
  "readerSituation": "React初心者でクラスコンポーネントに慣れている",
  "readerAnxieties": ["hooks は難しそう", "既存コードの書き換えが大変そう"],
  "decisionBarriers": ["学習コスト", "チーム内の合意"],
  "desiredOutcomes": ["自信を持ってhooksが使えるようになりたい"]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await deepDiveIntent(
      { keyword: 'test', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [] },
    );

    expect(result.readerSituation).toBeTruthy();
    expect(result.readerAnxieties).toBeInstanceOf(Array);
    expect(result.decisionBarriers).toBeInstanceOf(Array);
    expect(result.desiredOutcomes).toBeInstanceOf(Array);
  });
});
