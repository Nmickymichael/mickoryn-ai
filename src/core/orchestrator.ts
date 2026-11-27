import { AGENT_INSTRUCTIONS, CORE_IDENTITY } from './identity'
import { routeRequest } from './router'
import { demoProvider } from '../providers/demo'
import type { AIProvider, AIRequest, AIResult } from './types'

export async function runCore(
  request: AIRequest,
  provider: AIProvider = demoProvider,
): Promise<AIResult> {
  const agent = routeRequest(request.message)
  const instructions = `${CORE_IDENTITY}\n\nSpecialist role: ${AGENT_INSTRUCTIONS[agent]}`
  const answer = await provider.generate(instructions, [
    ...request.history.slice(-12),
    { role: 'user', content: request.message },
  ])
  return { answer, agent, provider: provider.name, simulated: provider.name === 'demo-simulation' }
}
