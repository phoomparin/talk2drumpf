import * as React from 'react'
import {useState, useEffect} from 'react'
import ReactDOM from 'react-dom'

import {
  playSound as play,
  preloadSoundClips
} from './utils/play'

import {soundFrom} from './utils/soundFrom'
import {drumpfSounds} from './sounds/drumpf'
import {useSpeechRecognition} from './hooks/useSpeechRecognition'

import "./main.scss"

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition
    run: (text: string) => {},
    play: typeof play,
  }
}

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
window.play = play

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let soundpack = drumpfSounds

preloadSoundClips(soundpack).then()

const random = items => items[Math.floor(Math.random() * items.length)]
const without = (haystack, needle) => haystack.filter(i => i !== needle)

interface Transcript {
  chat: string
  reply: string
}

interface TVProps {
  transcript: Transcript[]
  close: Function
}

function TranscriptViewer({transcript, close}: TVProps) {
  return (
    <div className="transcript-backdrop" onClick={close}>
      <div className="transcript-container">
        <div className="heading">📝 Ukraine Transcript</div>

        {transcript.map(t => (
          <div className="transcript" key={t.chat + t.reply}>
            <div>💬: {t.chat}</div>
            <div>🍔: <strong>{t.reply}</strong></div>
          </div>
        ))}
      </div>
    </div>
  )
}

const coverStyle = {
  backgroundImage: `url(https://source.unsplash.com/1920x1080/?trump&timestamp=${Date.now()})`
}

function App() {
  const [chat, setChat] = useState('...')
  const [reply, setReply] = useState('...')
  const [result, isListening, listen, stop, status] = useSpeechRecognition()

  const [transcript, setTranscript] = useState<Transcript[]>([])
  const [isTranscriptOpen, setTranscriptOpen] = useState(false)

  console.log('👂', status)

  const addTranscript = (chat: string, reply: string) =>
    setTranscript([...transcript, {chat, reply}])

  const toggleTranscript = () =>
    setTranscriptOpen(!isTranscriptOpen)

  function doReply(sound: string) {
    const reply = sound.replace(/_/g, ' ')
    setReply(reply)
    addTranscript(chat, reply)

    console.log(`💬: ${chat}`)
    console.log(`🍔: ${reply}`)

    return play(sound)
  }

  async function run(text: string) {
    setChat(text)

    const sounds = soundFrom(text, soundpack)
    const list = sounds.length > 1 ? sounds : soundpack

    const sound = random(list)
    await doReply(sound)

    await delay(600)
    await doReply(random(without(list, sound)))

    listen()
  }

  const indicatorClass = `listening-indicator blink ${isListening ? 'active' : ''}`

  window.run = run

  useEffect(() => {
    if (!isListening && result) {
      stop()

      run(result)
    }
  }, [isListening, result])

  return (
    <div className="container trump-cover" onClick={listen}>
      <div className="bg-blur-backdrop"></div>

      <div className="text-backdrop">
        <div className="text-container">
          <div className="result">💬: {chat}</div>

          <div className="reply-sentence">🍔: <strong>{reply}</strong></div>
        </div>
      </div>

      <div className={indicatorClass} onClick={listen}>
        {isListening ? '👂' : '🤫'}
      </div>

      <div className="transcript-btn" onClick={toggleTranscript}>
        📝
      </div>

      <div className="random-sound-clip" onClick={() => run('...')}>
        🎲
      </div>

      {isTranscriptOpen && <TranscriptViewer transcript={transcript} close={toggleTranscript} />}

      <input
        type="text"
        className="chat-input"
        onChange={e => setChat(e.target.value)}
        value={chat}
        onKeyPress={e => e.key === 'Enter' && run(chat)}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.querySelector('#app'))
