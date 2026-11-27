import { useState } from 'react'
import { Activity, AudioLines, BrainCircuit, Cpu, LockKeyhole, Mic, Send, ShieldCheck, Sparkles, Volume2 } from 'lucide-react'
import { runCore } from './core/orchestrator'
import type { ChatMessage } from './core/types'
import { listenOnce, speak } from './voice/speech'
import { supabaseConfigured } from './lib/supabase'

const agents = [
  ['JARVIS', 'Personal assistant', 'Message, planning and everyday reasoning'],
  ['THE MACHINE', 'Intelligence engine', 'Patterns and authorized data analysis'],
  ['SAMARITAN', 'Strategic intelligence', 'Scenarios, risks and decision support'],
  ['E.D.I.T.H.', 'Integration layer', 'Connected apps and approved workflows'],
  ['ZOLA', 'Predictive analytics', 'Trends, probabilities and forecasting'],
] as const

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello. I am MICKORYN AI. The central core is online in clearly labelled demo mode. What would you like to work on?' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [agent, setAgent] = useState('JARVIS')
  const [notice, setNotice] = useState('')

  async function sendMessage(text = input) {
    const clean = text.trim()
    if (!clean || busy) return
    const next = [...messages, { role: 'user' as const, content: clean }]
    setMessages(next)
    setInput('')
    setBusy(true)
    setNotice('')
    try {
      const result = await runCore({ message: clean, history: next.slice(0, -1) })
      setAgent(result.agent.toUpperCase())
      setMessages([...next, { role: 'assistant', content: result.answer }])
    } catch {
      setNotice('The request could not be completed. Check your connection and configuration.')
    } finally {
      setBusy(false)
    }
  }

  function startVoice() {
    listenOnce((text) => { setInput(text); void sendMessage(text) }, setNotice)
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><BrainCircuit size={24}/></div><div><b>MICKORYN</b><small>INTELLIGENCE SYSTEM</small></div></div>
      <div className="nav-label">COMMAND</div>
      <a className="nav active"><Activity size={17}/> Overview</a>
      <a className="nav"><BrainCircuit size={17}/> Intelligence core</a>
      <a className="nav"><Cpu size={17}/> Agent network</a>
      <a className="nav"><AudioLines size={17}/> Voice interface</a>
      <a className="nav"><LockKeyhole size={17}/> Memory & privacy</a>
      <div className="sidebar-bottom"><ShieldCheck size={17}/><span>Privacy-first architecture</span></div>
    </aside>
    <section className="main">
      <header><div><span className="eyebrow">PERSONAL INTELLIGENCE PLATFORM</span><h1>Central command</h1></div><div className="online"><i/> CORE READY</div></header>
      <section className="hero">
        <div><span className="eyebrow">MICKORYN CORE / VERSION 0.1</span><h2>One intelligence.<br/><em>Multiple minds.</em></h2><p>Your central interface for reasoning, memory, analysis and authorized operations.</p></div>
        <div className="orb"><div className="orb-inner"><BrainCircuit size={54}/></div></div>
      </section>
      <div className="status-grid">
        <div className="status-card"><span>AI PROVIDER</span><b>DEMO SIMULATION</b><small>Live model not connected</small></div>
        <div className="status-card"><span>DATABASE</span><b>{supabaseConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}</b><small>Supabase environment</small></div>
        <div className="status-card"><span>ACTIVE SPECIALIST</span><b>{agent}</b><small>Intent-based routing</small></div>
      </div>
      <div className="section-heading"><div><span className="eyebrow">SPECIALIZED INTELLIGENCE</span><h3>Agent network</h3></div><span className="muted">5 modules planned</span></div>
      <div className="agent-grid">{agents.map(([name, role, desc], i) => <div className="agent-card" key={name}><div className="agent-icon">{i === 0 ? <Sparkles/> : i === 1 ? <Activity/> : i === 2 ? <Cpu/> : i === 3 ? <AudioLines/> : <BrainCircuit/>}</div><b>{name}</b><span>{role}</span><p>{desc}</p></div>)}</div>
      <section className="chat">
        <div className="chat-head"><div><span className="eyebrow">SECURE CONVERSATION</span><h3>Talk to MICKORYN</h3></div><span className="mode">TEXT + VOICE</span></div>
        <div className="messages">{messages.map((m, i) => <div className={`bubble ${m.role}`} key={i}><span>{m.role === 'assistant' ? 'MICKORYN' : 'YOU'}</span><p>{m.content}</p>{m.role === 'assistant' && <button className="speak" onClick={() => speak(m.content)} title="Read aloud"><Volume2 size={15}/></button>}</div>)}{busy && <div className="typing">CORE PROCESSING…</div>}</div>
        {notice && <p className="notice">{notice}</p>}
        <div className="composer"><button className="icon-button" onClick={startVoice} title="Speak"><Mic size={19}/></button><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && void sendMessage()} placeholder="Send a command to your intelligence core…"/><button className="send" onClick={() => void sendMessage()} disabled={busy || !input.trim()}><Send size={17}/></button></div>
        <p className="disclaimer">Demo mode does not contact an AI model or execute external actions. Voice availability depends on your browser.</p>
      </section>
      <footer><span>MICKORYN AI © 2026</span><span>BUILT FOR PRIVACY · HUMAN CONTROL · CLARITY</span></footer>
    </section>
  </main>
}
