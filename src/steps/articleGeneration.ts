import type { ArticleOutline, StyleProfile, ArticleContent } from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildArticleGenerationPrompt(
  outline: ArticleOutline,
  styleProfile: StyleProfile,
  keyword: string,
): string {
  const sectionsText = outline.sections
    .map(
      (s) =>
        `### ${s.heading}\n小見出し: ${s.subheadings.join('、')}\n要点: ${s.keyPoints.join('、')}`,
    )
    .join('\n\n');

  return `あなたはプロのWebライターです。

## タスク

以下のアウトラインに基づいて、WordPress用のHTML記事本文を生成してください。

## 記事アウトライン

タイトル: ${outline.title}
メタディスクリプション: ${outline.metaDescription}
キーワード: ${keyword}

${sectionsText}

## 文体指示（このブログの既存記事スタイルに合わせる）

- 文体: ${styleProfile.writingStyle}
- 語尾パターン: ${styleProfile.sentenceEndings.join('、')}
- トーン: ${styleProfile.tone}
- 見出しパターン: ${styleProfile.headingPattern}
- セクション構成: ${styleProfile.sectionStructure}

## 執筆方針

- **腹落ち・納得**を重視：「なぜそうなるのか」を丁寧に説明
- 抽象的な説明だけでなく、具体例・コード例・数値を交える
- 読者の不安を先回りして解消する
- H2/H3タグを適切に使用し、WordPress のブロックエディタと互換性のあるHTMLで出力
- タイトルは本文に含めない（WordPressが自動付与するため）

## 出力形式

\`\`\`json
{
  "title": "記事タイトル",
  "htmlContent": "<h2>...</h2><p>...</p>...",
  "metaDescription": "メタディスクリプション",
  "tags": ["タグ1", "タグ2", "タグ3"]
}
\`\`\`

JSONのみを出力してください。htmlContentにはHTML本文全体を含めてください。`;
}

export async function generateArticle(
  outline: ArticleOutline,
  styleProfile: StyleProfile,
  keyword: string,
): Promise<ArticleContent> {
  const prompt = buildArticleGenerationPrompt(outline, styleProfile, keyword);
  const response = await callClaude(prompt);
  return extractJson<ArticleContent>(response);
}
