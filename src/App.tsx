import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { Activity, AudioLines, BrainCircuit, Cpu, LockKeyhole, Mic, Send, ShieldCheck, Sparkles, Volume2, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import type { ChatMessage } from './core/types'
import { listenOnce, speak } from './voice/speech'

const agents = [
  ['JARVIS', 'Personal assistant', 'Message, planning and everyday reasoning'],
  ['THE MACHINE', 'Intelligence engine', 'Patterns and authorized data analysis'],
  ['SAMARITAN', 'Strategic intelligence', 'Scenarios, risks and decision support'],
  ['E.D.I.T.H.', 'Integration layer', 'Connected apps and approved workflows'],
  ['ZOLA', 'Predictive analytics', 'Trends, probabilities and forecasting'],
] as const

function AuthPanel() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage(data.session ? 'Account created. You are signed in.' : 'Account created. Check your email to confirm it, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="brand-mark auth-mark"><BrainCircuit size={27}/></div>
    <span className="eyebrow">MICKORYN AI · PRIVATE ACCESS</span>
    <h1>{mode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h1>
    <p>Sign in to your private intelligence workspace. Your conversations are scoped to your account.</p>
    <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <label>Password<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
    {message && <p className="auth-message">{message}</p>}
    <button className="auth-submit" disabled={busy}>{busy ? 'PLEASE WAIT…' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
    <button type="button" className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>{mode === 'signin' ? 'New here? Create an account' : 'Already registered? Sign in'}</button>
    <small>Protected by Supabase Auth · Row-level security enabled</small>
  </form></main>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello. I am MICKORYN AI. Your central core is ready. What would you like to work on?' },
  ])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [agent, setAgent] = useState('JARVIS')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setUser(data.session?.user ?? null); setAuthReady(true) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setConversationId(null)
      setMessages([{ role: 'assistant', content: 'Hello. I am MICKORYN AI. Your central core is ready. What would you like to work on?' }])
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  async function sendMessage(text = input) {
    const clean = text.trim()
    if (!clean || busy || !user) return
    const previous = messages.filter((m, i) => !(i === 0 && m.role === 'assistant' && m.content.startsWith('Hello.')))
    const next = [...messages, { role: 'user' as const, content: clean }]
    setMessages(next)
    setInput('')
    setBusy(true)
    setNotice('')
    try {
      let activeConversation = conversationId
      if (!activeConversation) {
        const { data, error } = await supabase.from('ai_conversations')
          .insert({ user_id: user.id, title: clean.slice(0, 72) })
          .select('id').single()
        if (error) throw error
        activeConversation = data.id
        setConversationId(activeConversation)
      }

      const { error: userMessageError } = await supabase.from('ai_messages').insert({
        conversation_id: activeConversation, user_id: user.id, role: 'user', content: clean,
      })
      if (userMessageError) throw userMessageError

      const { data, error } = await supabase.functions.invoke('assistant-chat', {
        body: { message: clean, history: previous.slice(-10) },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const answer = typeof data?.answer === 'string' ? data.answer : 'The intelligence core returned an empty response.'
      setAgent(String(data.agent ?? 'jarvis').toUpperCase())
      const { error: assistantMessageError } = await supabase.from('ai_messages').insert({
        conversation_id: activeConversation, user_id: user.id, role: 'assistant',
        content: answer, agent: data.agent ?? 'jarvis', provider: data.provider ?? 'unknown',
      })
      if (assistantMessageError) throw assistantMessageError
      setMessages([...next, { role: 'assistant', content: answer }])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The request could not be completed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function startVoice() {
    listenOnce((text) => { setInput(text); void sendMessage(text) }, setNotice)
  }

  if (!authReady) return <main className="auth-screen"><div className="auth-card"><span className="eyebrow">MICKORYN AI</span><h1>Initializing secure session…</h1></div></main>
  if (!user) return <AuthPanel />

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
      <header><div><span className="eyebrow">PERSONAL INTELLIGENCE PLATFORM</span><h1>Central command</h1><small className="user-email">{user.email}</small></div><div className="header-actions"><div className="online"><i/> CORE READY</div><button className="logout" onClick={() => void supabase.auth.signOut()} title="Sign out"><LogOut size={15}/> Sign out</button></div></header>
      <section className="hero">
        <div><span className="eyebrow">MICKORYN CORE / VERSION 0.2</span><h2>One intelligence.<br/><em>Multiple minds.</em></h2><p>Your central interface for reasoning, memory, analysis and authorized operations.</p></div>
        <div className="orb"><div className="orb-inner"><BrainCircuit size={54}/></div></div>
      </section>
      <div className="status-grid">
        <div className="status-card"><span>AI PROVIDER</span><b>DEMO SIMULATION</b><small>Real model awaits server-side API key</small></div>
        <div className="status-card"><span>DATABASE</span><b>CONNECTED</b><small>Supabase · authenticated session</small></div>
        <div className="status-card"><span>ACTIVE SPECIALIST</span><b>{agent}</b><small>Server-side intent routing</small></div>
      </div>
      <div className="section-heading"><div><span className="eyebrow">SPECIALIZED INTELLIGENCE</span><h3>Agent network</h3></div><span className="muted">5 specialist modules</span></div>
      <div className="agent-grid">{agents.map(([name, role, desc], i) => <div className="agent-card" key={name}><div className="agent-icon">{i === 0 ? <Sparkles/> : i === 1 ? <Activity/> : i === 2 ? <Cpu/> : i === 3 ? <AudioLines/> : <BrainCircuit/>}</div><b>{name}</b><span>{role}</span><p>{desc}</p></div>)}</div>
      <section className="chat">
        <div className="chat-head"><div><span className="eyebrow">SECURE CONVERSATION</span><h3>Talk to MICKORYN</h3></div><span className="mode">TEXT + VOICE</span></div>
        <div className="messages">{messages.map((m, i) => <div className={`bubble ${m.role}`} key={i}><span>{m.role === 'assistant' ? 'MICKORYN' : 'YOU'}</span><p>{m.content}</p>{m.role === 'assistant' && <button className="speak" onClick={() => speak(m.content)} title="Read aloud"><Volume2 size={15}/></button>}</div>)}{busy && <div className="typing">CORE PROCESSING…</div>}</div>
        {notice && <p className="notice">{notice}</p>}
        <div className="composer"><button className="icon-button" onClick={startVoice} title="Speak"><Mic size={19}/></button><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && void sendMessage()} placeholder="Send a command to your intelligence core…"/><button className="send" onClick={() => void sendMessage()} disabled={busy || !input.trim()}><Send size={17}/></button></div>
        <p className="disclaimer">Your messages are saved to your private account. Demo mode is simulated and does not execute external actions.</p>
      </section>
      <footer><span>MICKORYN AI © 2026</span><span>BUILT FOR PRIVACY · HUMAN CONTROL · CLARITY</span></footer>
    </section>
  </main>
}
