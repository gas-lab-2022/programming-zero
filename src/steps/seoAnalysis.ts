import type { KeywordAnalysis, SeoAnalysis } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildSeoAnalysisPrompt(input: KeywordAnalysis): string {
  const queries = input.searchQueries.map((q) => `- ${q}`).join('\n');

  return `あなたはSEO分析の専門家です。

## コンテキスト
- キーワード: 「${input.keyword}」
- 表層意図: ${input.surfaceIntent}
- 潜在意図: ${input.latentIntent}
- 最終ゴール: ${input.finalGoal}

## タスク

以下の検索クエリでWeb検索を実行し、上位記事を分析してください。

### 検索クエリ
${queries}

**重要: WebSearchツールを使って実際に検索してください。**

### 分析項目
1. 上位記事（最大10件）のURL・タイトル・要約を収集
2. 上位記事に共通する構造パターンを抽出
3. 上位記事が共通してカバーしている必須トピックを特定
4. 上位記事に不足している点（差別化の機会）を特定

## 出力形式

\`\`\`json
{
  "topArticles": [
    {"url": "...", "title": "...", "summary": "..."}
  ],
  "commonStructure": ["..."],
  "mustCoverTopics": ["..."],
  "gapOpportunities": ["..."]
}
\`\`\`

検索を実行した後、上記のJSON形式で結果を出力してください。`;
}

export async function analyzeSeo(input: KeywordAnalysis): Promise<SeoAnalysis> {
  const prompt = buildSeoAnalysisPrompt(input);
  const response = await callClaude(prompt, {
    allowedTools: ['WebSearch', 'WebFetch'],
    maxTurns: 10,
  });
  return extractJson<SeoAnalysis>(response);
}
