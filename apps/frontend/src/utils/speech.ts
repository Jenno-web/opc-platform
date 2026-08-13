// 语音输入：H5 环境下用浏览器原生 Web Speech API 做语音转文字，
// 小程序/App 端没有这个 API，调用方需要检查 isSpeechRecognitionSupported() 做优雅降级。

interface SpeechRecognitionResultLike {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionResultLike) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

let activeRecognition: SpeechRecognitionLike | null = null

export function startVoiceRecognition(handlers: {
  onResult: (text: string) => void
  onEnd?: () => void
  onError?: () => void
}): boolean {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) return false

  const recognition = new Ctor()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? ''
    handlers.onResult(transcript)
  }
  recognition.onerror = () => handlers.onError?.()
  recognition.onend = () => handlers.onEnd?.()

  recognition.start()
  activeRecognition = recognition
  return true
}

export function stopVoiceRecognition() {
  activeRecognition?.stop()
  activeRecognition = null
}
