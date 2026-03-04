// WordPress configuration
export interface WpConfig {
  siteUrl: string;
  username: string;
  appPassword: string;
}

// WordPress post from REST API
export interface WpPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  date: string;
}

// WordPress post creation result
export interface WpPostResult {
  id: number;
  link: string;
  status: string;
}

// Step 0 output: Writing style profile
export interface StyleProfile {
  writingStyle: string;
  sentenceEndings: string[];
  tone: string;
  headingPattern: string;
  sectionStructure: string;
}

// Step 1 output: Keyword intent analysis
export interface KeywordAnalysis {
  keyword: string;
  surfaceIntent: string;
  latentIntent: string;
  finalGoal: string;
  searchQueries: string[];
}

// Step 2 output: SEO top article analysis
export interface SeoAnalysis {
  topArticles: Array<{
    url: string;
    title: string;
    summary: string;
  }>;
  commonStructure: string[];
  mustCoverTopics: string[];
  gapOpportunities: string[];
}

// Step 3 output: Reader intent deep dive
export interface IntentDeepDive {
  readerSituation: string;
  readerAnxieties: string[];
  decisionBarriers: string[];
  desiredOutcomes: string[];
}

// Step 4 output: Differentiation strategy
export interface Differentiation {
  differentiationPoints: Array<{
    category: string;
    description: string;
  }>;
  uniqueValueProposition: string;
}

// Step 5 output: Article outline
export interface ArticleOutline {
  title: string;
  metaDescription: string;
  sections: Array<{
    heading: string;
    subheadings: string[];
    keyPoints: string[];
  }>;
}

// Step 6 output: Generated article content
export interface ArticleContent {
  title: string;
  htmlContent: string;
  metaDescription: string;
  tags: string[];
}

// Pipeline accumulated context
export interface PipelineContext {
  keyword: string;
  styleProfile: StyleProfile;
  keywordAnalysis: KeywordAnalysis;
  seoAnalysis: SeoAnalysis;
  intentDeepDive: IntentDeepDive;
  differentiation: Differentiation;
  outline: ArticleOutline;
}

// Claude CLI wrapper options
export interface ClaudeOptions {
  allowedTools?: string[];
  maxTurns?: number;
}
