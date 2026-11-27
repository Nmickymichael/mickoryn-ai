export function speak(text: string) {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1
  window.speechSynthesis.speak(utterance)
  return true
}

export function listenOnce(onText: (text: string) => void, onError: (message: string) => void) {
  const SpeechRecognitionCtor = (window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }).SpeechRecognition ?? (window as Window & {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }).webkitSpeechRecognition

  if (!SpeechRecognitionCtor) {
    onError('Speech recognition is not supported by this browser. You can type instead.')
    return
  }
  const recognition = new SpeechRecognitionCtor()
  recognition.lang = 'en-KE'
  recognition.interimResults = false
  recognition.onresult = (event) => onText(event.results[0][0].transcript)
  recognition.onerror = () => onError('Voice input was unavailable. Please try typing.')
  recognition.start()
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  start(): void
}
