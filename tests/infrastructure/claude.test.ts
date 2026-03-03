import { describe, it, expect, vi, beforeEach } from 'vitest'
import { query, type Query } from '@anthropic-ai/claude-agent-sdk'
import { callAgent } from '../../src/infrastructure/claude.js'

vi.mock('@anthropic-ai/claude-agent-sdk')

// Query extends AsyncGenerator but adds control methods irrelevant to tests.
// Cast plain AsyncGenerator to Query for use in mockImplementation.
function asQuery(gen: AsyncGenerator<unknown>): Query {
  return gen as unknown as Query
}

describe('callAgent', () => {
  beforeEach(() => {
    vi.mocked(query).mockReset()
  })

  it('should parse JSON result and return typed object', async () => {
    // Given: agent yields a message with a JSON result
    const expectedOutput = { surfaceIntent: 'learn TypeScript', latentIntent: 'get a job' }
    vi.mocked(query).mockImplementation(() =>
      asQuery(
        (async function* () {
          yield { result: JSON.stringify(expectedOutput) }
        })(),
      ),
    )

    // When: callAgent is invoked
    const result = await callAgent<typeof expectedOutput>({
      systemPrompt: 'You are an SEO expert',
      userPrompt: 'Analyze the keyword',
      outputSchema: { type: 'object' },
    })

    // Then: returns the parsed object
    expect(result).toEqual(expectedOutput)
  })

  it('should throw when agent yields no result message', async () => {
    // Given: agent yields only non-result messages
    vi.mocked(query).mockImplementation(() =>
      asQuery(
        (async function* () {
          yield { type: 'text', text: 'thinking...' }
          yield { type: 'tool_use', name: 'some_tool' }
        })(),
      ),
    )

    // When / Then: throws with a clear error
    await expect(
      callAgent({ systemPrompt: 'x', userPrompt: 'y', outputSchema: {} }),
    ).rejects.toThrow('Agent returned no result')
  })

  it('should use the last result message when multiple result messages are yielded', async () => {
    // Given: agent yields multiple result messages
    const finalOutput = { value: 'final' }
    vi.mocked(query).mockImplementation(() =>
      asQuery(
        (async function* () {
          yield { result: JSON.stringify({ value: 'intermediate' }) }
          yield { result: JSON.stringify(finalOutput) }
        })(),
      ),
    )

    // When: callAgent is invoked
    const result = await callAgent<typeof finalOutput>({
      systemPrompt: 'x',
      userPrompt: 'y',
      outputSchema: {},
    })

    // Then: uses the last result
    expect(result).toEqual(finalOutput)
  })

  it('should pass systemPrompt and userPrompt to query', async () => {
    // Given: mocked query that captures arguments
    let capturedArgs: Parameters<typeof query>[0] | undefined
    vi.mocked(query).mockImplementation((args) => {
      capturedArgs = args
      return asQuery(
        (async function* () {
          yield { result: '{}' }
        })(),
      )
    })

    // When: callAgent is called with specific prompts
    await callAgent({
      systemPrompt: 'You are an expert',
      userPrompt: 'Analyze keyword: TypeScript',
      outputSchema: {},
    })

    // Then: the prompts are passed to query
    expect(capturedArgs?.prompt).toBe('Analyze keyword: TypeScript')
    expect((capturedArgs?.options as Record<string, unknown>)?.systemPrompt).toBe(
      'You are an expert',
    )
  })

  it('should pass outputSchema as json_schema format to query', async () => {
    // Given: a specific output schema
    const schema = { type: 'object', properties: { title: { type: 'string' } } }
    let capturedOptions: Record<string, unknown> | undefined
    vi.mocked(query).mockImplementation((args) => {
      capturedOptions = args.options as Record<string, unknown>
      return asQuery(
        (async function* () {
          yield { result: '{"title":"test"}' }
        })(),
      )
    })

    // When: callAgent is called with the schema
    await callAgent({ systemPrompt: 'x', userPrompt: 'y', outputSchema: schema })

    // Then: outputFormat uses json_schema type with the schema
    expect(capturedOptions?.outputFormat).toEqual({ type: 'json_schema', schema })
  })

  it('should unset CLAUDECODE in env to prevent nested session error', async () => {
    // Given: mocked query that captures env
    let capturedOptions: Record<string, unknown> | undefined
    vi.mocked(query).mockImplementation((args) => {
      capturedOptions = args.options as Record<string, unknown>
      return asQuery(
        (async function* () {
          yield { result: '{}' }
        })(),
      )
    })

    // When: callAgent is called
    await callAgent({ systemPrompt: 'x', userPrompt: 'y', outputSchema: {} })

    // Then: CLAUDECODE is explicitly set to undefined to avoid nested-session errors
    const env = capturedOptions?.env as Record<string, unknown>
    expect(env).toBeDefined()
    expect(Object.prototype.hasOwnProperty.call(env, 'CLAUDECODE')).toBe(true)
    expect(env['CLAUDECODE']).toBeUndefined()
  })

  it('should restrict tools to none (inference-only mode)', async () => {
    // Given: mocked query that captures options
    let capturedOptions: Record<string, unknown> | undefined
    vi.mocked(query).mockImplementation((args) => {
      capturedOptions = args.options as Record<string, unknown>
      return asQuery(
        (async function* () {
          yield { result: '{}' }
        })(),
      )
    })

    // When: callAgent is called
    await callAgent({ systemPrompt: 'x', userPrompt: 'y', outputSchema: {} })

    // Then: allowedTools is empty (inference-only)
    expect(capturedOptions?.allowedTools).toEqual([])
  })
})
