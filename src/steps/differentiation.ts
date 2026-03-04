import type {
  KeywordAnalysis,
  SeoAnalysis,
  IntentDeepDive,
  Differentiation,
} from '../types.js';
import { callClaude } from '../utils/claude.js';
import { extractJson } from '../utils/json.js';

export function buildDifferentiationPrompt(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
): string {
  return `あなたはコンテンツ戦略の専門家です。

## コンテキスト

### キーワード: 「${keywordAnalysis.keyword}」
- 表層意図: ${keywordAnalysis.surfaceIntent}
- 潜在意図: ${keywordAnalysis.latentIntent}
- 最終ゴール: ${keywordAnalysis.finalGoal}

### 上位記事の状況
- 共通構造: ${seoAnalysis.commonStructure.join('、')}
- 必須トピック: ${seoAnalysis.mustCoverTopics.join('、')}
- 差別化機会: ${seoAnalysis.gapOpportunities.join('、')}

### 読者心理
- 状況: ${intentDeepDive.readerSituation}
- 不安: ${intentDeepDive.readerAnxieties.join('、')}
- 決断障壁: ${intentDeepDive.decisionBarriers.join('、')}
- 望む結果: ${intentDeepDive.desiredOutcomes.join('、')}

## タスク

上位記事を「超える」ための差別化ポイントを、以下の4カテゴリから設計してください：

1. **構造化**: 情報の整理・視覚化・チートシート化
2. **データ**: 具体的な数値・事例・比較データ
3. **因果説明**: 「なぜそうなるのか」の深い説明
4. **失敗パターン**: 読者が陥りやすい失敗とその回避法

全カテゴリを使う必要はありません。効果的なものを選んでください。

## 出力形式

\`\`\`json
{
  "differentiationPoints": [
    {"category": "構造化 | データ | 因果説明 | 失敗パターン", "description": "..."}
  ],
  "uniqueValueProposition": "この記事ならではの価値を一文で"
}
\`\`\`

JSONのみを出力してください。`;
}

export async function designDifferentiation(
  keywordAnalysis: KeywordAnalysis,
  seoAnalysis: SeoAnalysis,
  intentDeepDive: IntentDeepDive,
): Promise<Differentiation> {
  const prompt = buildDifferentiationPrompt(keywordAnalysis, seoAnalysis, intentDeepDive);
  const response = await callClaude(prompt);
  return extractJson<Differentiation>(response);
}
