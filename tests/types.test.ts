import { describe, it, expectTypeOf } from 'vitest';
import type {
  WpConfig,
  WpPost,
  WpPostResult,
  StyleProfile,
  KeywordAnalysis,
  SeoAnalysis,
  IntentDeepDive,
  Differentiation,
  ArticleOutline,
  ArticleContent,
  PipelineContext,
} from '../src/types.js';

describe('types', () => {
  it('WpConfig has required fields', () => {
    expectTypeOf<WpConfig>().toHaveProperty('siteUrl');
    expectTypeOf<WpConfig>().toHaveProperty('username');
    expectTypeOf<WpConfig>().toHaveProperty('appPassword');
  });

  it('StyleProfile has required fields', () => {
    expectTypeOf<StyleProfile>().toHaveProperty('writingStyle');
    expectTypeOf<StyleProfile>().toHaveProperty('sentenceEndings');
    expectTypeOf<StyleProfile>().toHaveProperty('tone');
    expectTypeOf<StyleProfile>().toHaveProperty('headingPattern');
    expectTypeOf<StyleProfile>().toHaveProperty('sectionStructure');
  });

  it('PipelineContext accumulates all step outputs', () => {
    expectTypeOf<PipelineContext>().toHaveProperty('keyword');
    expectTypeOf<PipelineContext>().toHaveProperty('styleProfile');
    expectTypeOf<PipelineContext>().toHaveProperty('keywordAnalysis');
    expectTypeOf<PipelineContext>().toHaveProperty('seoAnalysis');
    expectTypeOf<PipelineContext>().toHaveProperty('intentDeepDive');
    expectTypeOf<PipelineContext>().toHaveProperty('differentiation');
    expectTypeOf<PipelineContext>().toHaveProperty('outline');
  });

  it('ArticleContent has fields needed for WordPress publishing', () => {
    expectTypeOf<ArticleContent>().toHaveProperty('title');
    expectTypeOf<ArticleContent>().toHaveProperty('htmlContent');
    expectTypeOf<ArticleContent>().toHaveProperty('metaDescription');
  });
});
