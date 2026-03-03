// ─── Step 1 ───────────────────────────────────────────────────────────────────

export interface KeywordAnalysisInput {
  keyword: string
}

export interface KeywordAnalysisOutput {
  keyword: string
  surfaceIntent: string
  latentIntent: string
  finalGoal: string
  searchQueries: string[]
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

export interface ArticleSource {
  url: string
  title: string
  content: string
}

export interface SeoAnalysisOutput extends KeywordAnalysisOutput {
  topArticles: ArticleSource[]
  commonStructure: string[]
  mustCoverTopics: string[]
  gapOpportunities: string[]
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

export interface IntentDeepDiveOutput extends SeoAnalysisOutput {
  readerSituation: string
  readerAnxieties: string[]
  decisionBarriers: string[]
  desiredOutcomes: string[]
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

export interface DifferentiationPoint {
  angle: string
  rationale: string
}

export interface DifferentiationOutput extends IntentDeepDiveOutput {
  differentiationPoints: DifferentiationPoint[]
  uniqueValueProposition: string
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────

export interface OutlineSection {
  heading: string
  subheadings: string[]
  keyPoints: string[]
}

export interface OutlineOutput extends DifferentiationOutput {
  title: string
  metaDescription: string
  sections: OutlineSection[]
}

// ─── Step 6 ───────────────────────────────────────────────────────────────────

export interface ArticleContent {
  title: string
  htmlContent: string
  slug: string
  excerpt: string
  tags: string[]
}

export interface WordPressPostResult {
  id: number
  link: string
  status: 'publish' | 'draft'
}

// ─── Infrastructure ───────────────────────────────────────────────────────────

export interface WordPressConfig {
  siteUrl: string
  username: string
  appPassword: string
}
