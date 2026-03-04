import { describe, it, expect, vi } from 'vitest';
import { buildOutlinePrompt, createOutline } from '../../src/steps/outline.js';
import * as claude from '../../src/utils/claude.js';

vi.mock('../../src/utils/claude.js');

describe('buildOutlinePrompt', () => {
  it('includes StyleProfile for section structure', () => {
    const prompt = buildOutlinePrompt(
      { keyword: 'Git 使い方', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: ['基本コマンド'], gapOpportunities: [] },
      { readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [] },
      {
        differentiationPoints: [{ category: '構造化', description: 'フロー図で解説' }],
        uniqueValueProposition: '',
      },
      {
        writingStyle: '丁寧な説明',
        sentenceEndings: ['です', 'ます'],
        tone: '敬体',
        headingPattern: 'H2は疑問形',
        sectionStructure: '導入→解説→まとめ',
      },
    );

    expect(prompt).toContain('H2は疑問形');
    expect(prompt).toContain('導入→解説→まとめ');
    expect(prompt).toContain('共感→問題整理→本質解説→具体策→失敗例→結論');
  });
});

describe('createOutline', () => {
  it('calls Claude and returns ArticleOutline', async () => {
    const mockResponse = `\`\`\`json
{
  "title": "【初心者向け】Git の使い方を完全解説",
  "metaDescription": "Gitの基本から実践まで解説。初心者がつまずくポイントも網羅。",
  "sections": [
    {
      "heading": "Gitとは？なぜ必要なのか",
      "subheadings": ["バージョン管理の重要性", "Gitが選ばれる理由"],
      "keyPoints": ["コードの変更履歴を管理", "チーム開発に必須"]
    }
  ]
}
\`\`\``;

    vi.mocked(claude.callClaude).mockResolvedValue(mockResponse);

    const result = await createOutline(
      { keyword: '', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [] },
      { topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [] },
      { readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [] },
      { differentiationPoints: [], uniqueValueProposition: '' },
      { writingStyle: '', sentenceEndings: [], tone: '', headingPattern: '', sectionStructure: '' },
    );

    expect(result.title).toBeTruthy();
    expect(result.metaDescription).toBeTruthy();
    expect(result.sections).toBeInstanceOf(Array);
    expect(result.sections[0].heading).toBeTruthy();
  });
});
