import type { StyleProfile } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildStyleAnalysisPrompt(
  articles: Array<{ title: string; content: string }>,
): string {
  const articlesText = articles
    .map((a, i) => `### 記事${i + 1}: ${a.title}\n${a.content}`)
    .join('\n\n---\n\n');

  return `あなたは文体分析の専門家です。

以下は WordPress ブログ「programming-zero.net」の既存記事です。これらの記事の文体・スタイルを分析してください。

## 分析対象の記事

${articlesText}

## 分析項目

以下の観点で分析し、JSON形式で出力してください：

1. **writingStyle**: 文体の全体的な特徴（説明的か会話的か、簡潔か詳細か、など）
2. **sentenceEndings**: よく使われる語尾パターン（配列で3〜5個）
3. **tone**: 敬体/常体の判定と、トーンの特徴（親しみやすさ、専門性など）
4. **headingPattern**: H2/H3見出しの使い方パターン（命名規則、粒度など）
5. **sectionStructure**: セクション構成の傾向（導入→本題→まとめ、など）

## 出力形式

\`\`\`json
{
  "writingStyle": "...",
  "sentenceEndings": ["...", "..."],
  "tone": "...",
  "headingPattern": "...",
  "sectionStructure": "..."
}
\`\`\`

JSONのみを出力してください。`;
}

export async function analyzeStyle(
  articles: Array<{ title: string; content: string }>,
): Promise<StyleProfile> {
  const prompt = buildStyleAnalysisPrompt(articles);
  const response = await callClaude(prompt);
  return extractJson<StyleProfile>(response);
}
