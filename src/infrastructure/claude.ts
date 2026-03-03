import { query, type Options } from '@anthropic-ai/claude-agent-sdk'

export interface CallAgentOptions {
  systemPrompt: string
  userPrompt: string
  outputSchema: Record<string, unknown>
}

export async function callAgent<T>(options: CallAgentOptions): Promise<T> {
  const agentOptions: Options = {
    systemPrompt: options.systemPrompt,
    allowedTools: [],
    outputFormat: { type: 'json_schema', schema: options.outputSchema },
    env: { ...process.env, CLAUDECODE: undefined },
  }

  const queryStream = query({ prompt: options.userPrompt, options: agentOptions })

  let lastResult: string | undefined
  for await (const message of queryStream) {
    const msg = message as Record<string, unknown>
    if (typeof msg['result'] === 'string') {
      lastResult = msg['result']
    }
  }

  if (lastResult === undefined) {
    throw new Error('Agent returned no result')
  }

  return JSON.parse(lastResult) as T
}
