import type {
  KeywordAnalysis,
  SeoAnalysis,
  IntentDeepDive,
  Differentiation,
  StyleProfile,
  ArticleOutline,
} from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildOutlinePrompt(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
  differentiation: Differentiation,
  styleProfile: StyleProfile,
): string {
  const diffPoints = differentiation.differentiationPoints
    .map((p) => `- [${p.category}] ${p.description}`)
    .join('\n');

  return `あなたは記事設計の専門家です。

## コンテキスト

### キーワード: 「${keywordAnalysis.keyword}」
- 表層意図: ${keywordAnalysis.surfaceIntent}
- 潜在意図: ${keywordAnalysis.latentIntent}
- 最終ゴール: ${keywordAnalysis.finalGoal}

### 必須カバー項目
${seoAnalysis.mustCoverTopics.map((t) => `- ${t}`).join('\n')}

### 読者心理
- 状況: ${intentDeepDive.readerSituation}
- 不安: ${intentDeepDive.readerAnxieties.join('、')}
- 望む結果: ${intentDeepDive.desiredOutcomes.join('、')}

### 差別化ポイント
${diffPoints}
- 独自価値: ${differentiation.uniqueValueProposition}

### ブログのスタイルプロファイル（この形式に合わせる）
- 見出しパターン: ${styleProfile.headingPattern}
- セクション構成: ${styleProfile.sectionStructure}

## タスク

以下のナラティブ構造をベースに、記事アウトラインを作成してください：

**共感→問題整理→本質解説→具体策→失敗例→結論**

スタイルプロファイルの見出しパターンとセクション構成を反映してください。

## 出力形式

\`\`\`json
{
  "title": "記事タイトル（SEO最適化、32文字以内推奨）",
  "metaDescription": "メタディスクリプション（120文字以内）",
  "sections": [
    {
      "heading": "H2見出し",
      "subheadings": ["H3見出し1", "H3見出し2"],
      "keyPoints": ["このセクションで伝える要点1", "要点2"]
    }
  ]
}
\`\`\`

JSONのみを出力してください。`;
}

export async function createOutline(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
  differentiation: Differentiation,
  styleProfile: StyleProfile,
): Promise<ArticleOutline> {
  const prompt = buildOutlinePrompt(
    keywordAnalysis,
    seoAnalysis,
    intentDeepDive,
    differentiation,
    styleProfile,
  );
  const response = await callClaude(prompt);
  return extractJson<ArticleOutline>(response);
}
