import type { AgentName } from './types'

const rules: Array<[RegExp, AgentName]> = [
  [/forecast|predict|trend|probability|historical data/i, 'zola'],
  [/connect|integration|send|schedule|execute|automation|application/i, 'edith'],
  [/strategy|scenario|risk|business decision|roadmap/i, 'samaritan'],
  [/pattern|anomaly|monitor|analyze|investigate/i, 'machine'],
]

export function routeRequest(message: string): AgentName {
  return rules.find(([pattern]) => pattern.test(message))?.[1] ?? 'jarvis'
}
