import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from '../src/pipeline.js';
import * as wordpress from '../src/utils/wordpress.js';
import * as html from '../src/utils/html.js';
import * as styleAnalysisStep from '../src/steps/styleAnalysis.js';
import * as keywordAnalysisStep from '../src/steps/keywordAnalysis.js';
import * as seoAnalysisStep from '../src/steps/seoAnalysis.js';
import * as intentDeepDiveStep from '../src/steps/intentDeepDive.js';
import * as differentiationStep from '../src/steps/differentiation.js';
import * as outlineStep from '../src/steps/outline.js';
import * as articleGenerationStep from '../src/steps/articleGeneration.js';

vi.mock('../src/utils/wordpress.js');
vi.mock('../src/utils/html.js');
vi.mock('../src/steps/styleAnalysis.js');
vi.mock('../src/steps/keywordAnalysis.js');
vi.mock('../src/steps/seoAnalysis.js');
vi.mock('../src/steps/intentDeepDive.js');
vi.mock('../src/steps/differentiation.js');
vi.mock('../src/steps/outline.js');
vi.mock('../src/steps/articleGeneration.js');

const config = { siteUrl: 'https://example.com', username: 'user', appPassword: 'pass' };

describe('runPipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.mocked(wordpress.fetchRecentPosts).mockResolvedValue([
      { id: 1, title: { rendered: 'Post' }, content: { rendered: '<p>Content</p>' }, excerpt: { rendered: '' }, link: '', date: '' },
    ]);
    vi.mocked(html.stripHtml).mockReturnValue('Content');
    vi.mocked(styleAnalysisStep.analyzeStyle).mockResolvedValue({
      writingStyle: 'test', sentenceEndings: [], tone: 'test', headingPattern: 'test', sectionStructure: 'test',
    });
    vi.mocked(keywordAnalysisStep.analyzeKeyword).mockResolvedValue({
      keyword: 'test', surfaceIntent: '', latentIntent: '', finalGoal: '', searchQueries: [],
    });
    vi.mocked(seoAnalysisStep.analyzeSeo).mockResolvedValue({
      topArticles: [], commonStructure: [], mustCoverTopics: [], gapOpportunities: [],
    });
    vi.mocked(intentDeepDiveStep.deepDiveIntent).mockResolvedValue({
      readerSituation: '', readerAnxieties: [], decisionBarriers: [], desiredOutcomes: [],
    });
    vi.mocked(differentiationStep.designDifferentiation).mockResolvedValue({
      differentiationPoints: [], uniqueValueProposition: '',
    });
    vi.mocked(outlineStep.createOutline).mockResolvedValue({
      title: 'Test Title', metaDescription: 'Test', sections: [],
    });
    vi.mocked(articleGenerationStep.generateArticle).mockResolvedValue({
      title: 'Test Title', htmlContent: '<p>Test</p>', metaDescription: 'Test', tags: [],
    });
    vi.mocked(wordpress.publishPost).mockResolvedValue({
      id: 42, link: 'https://example.com/test', status: 'draft',
    });
  });

  it('executes all steps in order and returns WordPress result', async () => {
    const result = await runPipeline('テスト', config);

    expect(wordpress.fetchRecentPosts).toHaveBeenCalledWith(config, 5);
    expect(styleAnalysisStep.analyzeStyle).toHaveBeenCalled();
    expect(keywordAnalysisStep.analyzeKeyword).toHaveBeenCalledWith('テスト');
    expect(seoAnalysisStep.analyzeSeo).toHaveBeenCalled();
    expect(intentDeepDiveStep.deepDiveIntent).toHaveBeenCalled();
    expect(differentiationStep.designDifferentiation).toHaveBeenCalled();
    expect(outlineStep.createOutline).toHaveBeenCalled();
    expect(articleGenerationStep.generateArticle).toHaveBeenCalled();
    expect(wordpress.publishPost).toHaveBeenCalled();

    expect(result).toEqual({ id: 42, link: 'https://example.com/test', status: 'draft' });
  });

  it('passes StyleProfile to outline and article generation steps', async () => {
    await runPipeline('テスト', config);

    const outlineCall = vi.mocked(outlineStep.createOutline).mock.calls[0];
    expect(outlineCall[4]).toHaveProperty('writingStyle', 'test');

    const articleCall = vi.mocked(articleGenerationStep.generateArticle).mock.calls[0];
    expect(articleCall[1]).toHaveProperty('writingStyle', 'test');
  });

  it('strips HTML from fetched posts before style analysis', async () => {
    await runPipeline('テスト', config);

    expect(html.stripHtml).toHaveBeenCalledWith('<p>Content</p>');
    const styleAnalysisCall = vi.mocked(styleAnalysisStep.analyzeStyle).mock.calls[0];
    expect(styleAnalysisCall[0][0].content).toBe('Content');
  });
});
