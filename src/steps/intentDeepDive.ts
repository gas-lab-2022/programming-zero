import type { KeywordAnalysis, SeoAnalysis, IntentDeepDive } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildIntentDeepDivePrompt(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
): string {
  return `あなたはユーザー心理の専門家です。

## コンテキスト

### キーワード分析
- キーワード: 「${keywordAnalysis.keyword}」
- 表層意図: ${keywordAnalysis.surfaceIntent}
- 潜在意図: ${keywordAnalysis.latentIntent}
- 最終ゴール: ${keywordAnalysis.finalGoal}

### SEO上位記事の分析
- 共通構造: ${seoAnalysis.commonStructure.join('、')}
- 必須トピック: ${seoAnalysis.mustCoverTopics.join('、')}
- 差別化機会: ${seoAnalysis.gapOpportunities.join('、')}

## タスク

このキーワードで検索する読者について、以下を深掘りして言語化してください：

1. **読者の状況（readerSituation）**: 検索時の典型的な状況・背景
2. **読者の不安（readerAnxieties）**: 抱えている不安や懸念（配列で3〜5個）
3. **決断障壁（decisionBarriers）**: 行動に移れない理由（配列で3〜5個）
4. **読後に望む結果（desiredOutcomes）**: 記事を読んだ後どうなりたいか（配列で3〜5個）

## 出力形式

\`\`\`json
{
  "readerSituation": "...",
  "readerAnxieties": ["..."],
  "decisionBarriers": ["..."],
  "desiredOutcomes": ["..."]
}
\`\`\`

JSONのみを出力してください。`;
}

export async function deepDiveIntent(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
): Promise<IntentDeepDive> {
  const prompt = buildIntentDeepDivePrompt(keywordAnalysis, seoAnalysis);
  const response = await callClaude(prompt);
  return extractJson<IntentDeepDive>(response);
}
