import type { AIProvider, ChatMessage } from '../core/types'

export const demoProvider: AIProvider = {
  name: 'demo-simulation',
  async generate(_systemInstructions: string, conversation: ChatMessage[]) {
    const latest = conversation.at(-1)?.content ?? ''
    return [
      '[DEMO MODE — this is a simulated response, not a live AI model.]',
      `MICKORYN AI received: “${latest}”`,
      'The central core and routing are ready for provider integration. Configure the authenticated server-side OpenAI provider to enable real model reasoning.',
    ].join('\n\n')
  },
}
