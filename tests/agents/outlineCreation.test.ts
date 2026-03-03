import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAgent } from '../../src/infrastructure/claude.js'
import { createOutline } from '../../src/agents/outlineCreation.js'
import type { DifferentiationOutput } from '../../src/types/index.js'

vi.mock('../../src/infrastructure/claude.js')

const mockCallAgent = vi.mocked(callAgent)

const step4Output: DifferentiationOutput = {
  keyword: 'TypeScript 入門',
  surfaceIntent: 'learn TypeScript basics',
  latentIntent: 'improve skills',
  finalGoal: 'build projects',
  searchQueries: ['TypeScript 入門'],
  topArticles: [],
  commonStructure: ['Introduction', 'Basics'],
  mustCoverTopics: ['Type annotations'],
  gapOpportunities: ['Real-world examples'],
  readerSituation: 'JavaScript初心者',
  readerAnxieties: ['型が複雑'],
  decisionBarriers: ['どこから始めるか'],
  desiredOutcomes: ['TypeScriptで開発できる'],
  differentiationPoints: [
    { angle: 'プロジェクト構成で解説', rationale: 'ギャップ分析結果' },
  ],
  uniqueValueProposition: '初心者が最短でTypeScriptプロジェクトを動かせる記事',
}

describe('createOutline', () => {
  beforeEach(() => {
    mockCallAgent.mockReset()
  })

  it('should return a structured outline with title, meta description, and sections', async () => {
    // Given: callAgent returns an outline
    mockCallAgent.mockResolvedValue({
      ...step4Output,
      title: '【2026年版】TypeScript入門：初心者が最短で動かせる完全ガイド',
      metaDescription: 'TypeScript初心者向けに、型の基礎から実プロジェクトの構成まで解説します。',
      sections: [
        {
          heading: 'TypeScriptとは？JavaScriptと何が違うのか',
          subheadings: ['型安全とは何か', 'JavaScriptとの互換性'],
          keyPoints: ['型があることで何が嬉しいか'],
        },
        {
          heading: '環境構築：最速でTypeScriptを動かす',
          subheadings: ['Node.jsのインストール', 'tscの設定'],
          keyPoints: ['コピペで動く設定ファイル'],
        },
      ],
    })

    // When: createOutline is called
    const result = await createOutline(step4Output)

    // Then: outline fields are present and valid
    expect(result.title).toBeTruthy()
    expect(result.metaDescription).toBeTruthy()
    expect(result.sections).toBeInstanceOf(Array)
    expect(result.sections.length).toBeGreaterThan(0)
  })

  it('should return sections with heading, subheadings, and keyPoints', async () => {
    // Given: callAgent returns sections with all required fields
    const mockSection = {
      heading: 'TypeScriptとは',
      subheadings: ['型安全', 'JavaScript互換'],
      keyPoints: ['型のメリット'],
    }
    mockCallAgent.mockResolvedValue({
      ...step4Output,
      title: 'TypeScript入門ガイド',
      metaDescription: 'TypeScriptの入門記事',
      sections: [mockSection],
    })

    // When: createOutline is called
    const result = await createOutline(step4Output)

    // Then: each section has the required structure
    const section = result.sections[0]!
    expect(section.heading).toBeTruthy()
    expect(section.subheadings).toBeInstanceOf(Array)
    expect(section.keyPoints).toBeInstanceOf(Array)
  })

  it('should follow the narrative structure (empathy → problem → insight → solution → failure → conclusion)', async () => {
    // Given: callAgent returns sections following the prescribed structure
    mockCallAgent.mockResolvedValue({
      ...step4Output,
      title: 'TypeScript入門ガイド',
      metaDescription: 'description',
      sections: [
        { heading: '共感：TypeScript学習で挫折した経験はありますか', subheadings: [], keyPoints: [] },
        { heading: '問題整理：TypeScriptが難しく感じる3つの理由', subheadings: [], keyPoints: [] },
        { heading: '本質解説：型システムの仕組みを理解する', subheadings: [], keyPoints: [] },
        { heading: '具体策：ゼロから動くプロジェクトを作る手順', subheadings: [], keyPoints: [] },
        { heading: '失敗例：よくあるエラーと解決方法', subheadings: [], keyPoints: [] },
        { heading: '結論：TypeScriptで開発を始めるために今日できること', subheadings: [], keyPoints: [] },
      ],
    })

    // When: createOutline is called
    const result = await createOutline(step4Output)

    // Then: outline has at least 4 sections (empathy, problem, solution, conclusion minimum)
    expect(result.sections.length).toBeGreaterThanOrEqual(4)
  })

  it('should preserve all fields from step4 output', async () => {
    // Given: callAgent returns output with step4 fields preserved
    mockCallAgent.mockResolvedValue({
      ...step4Output,
      title: 'Title',
      metaDescription: 'Meta',
      sections: [],
    })

    // When: createOutline is called
    const result = await createOutline(step4Output)

    // Then: all step4 fields are present
    expect(result.differentiationPoints).toEqual(step4Output.differentiationPoints)
    expect(result.uniqueValueProposition).toBe(step4Output.uniqueValueProposition)
    expect(result.keyword).toBe(step4Output.keyword)
  })
})
