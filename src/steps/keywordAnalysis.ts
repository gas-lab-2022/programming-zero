import type { KeywordAnalysis } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildKeywordAnalysisPrompt(keyword: string): string {
  return `あなたはSEO戦略の専門家です。

以下のキーワードについて、検索意図を3段階の仮説で言語化してください。

## 対象キーワード
「${keyword}」

## 分析タスク

1. **表層意図（surfaceIntent）**: ユーザーが文字通り知りたいこと
2. **潜在意図（latentIntent）**: 表面に出ていないが本当に解決したい課題
3. **最終ゴール（finalGoal）**: この検索の先にある理想の状態

さらに、この意図を深く理解するために有用な派生検索クエリを3〜5個生成してください。

## 出力形式

\`\`\`json
{
  "keyword": "${keyword}",
  "surfaceIntent": "...",
  "latentIntent": "...",
  "finalGoal": "...",
  "searchQueries": ["...", "...", "..."]
}
\`\`\`

JSONのみを出力してください。`;
}

export async function analyzeKeyword(keyword: string): Promise<KeywordAnalysis> {
  const prompt = buildKeywordAnalysisPrompt(keyword);
  const response = await callClaude(prompt);
  return extractJson<KeywordAnalysis>(response);
}
