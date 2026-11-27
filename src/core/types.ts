export type AgentName = 'jarvis' | 'machine' | 'samaritan' | 'edith' | 'zola'
export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface AIRequest {
  message: string
  history: ChatMessage[]
}

export interface AIResult {
  answer: string
  agent: AgentName
  provider: string
  simulated: boolean
}

export interface AIProvider {
  readonly name: string
  generate(systemInstructions: string, conversation: ChatMessage[]): Promise<string>
}
