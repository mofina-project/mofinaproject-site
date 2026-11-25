(() => {
  const audio = document.getElementById("page-bgm")
  const button = document.getElementById("page-bgm-toggle")
  const volume = 0.12
  const key = "mofina_bgm_off"
  const AudioContext = window.AudioContext || window.webkitAudioContext
  let context
  let off = false

  try {
    off = localStorage.getItem(key) === "1"
  } catch {}

  function syncButton() {
    button.setAttribute("aria-pressed", String(!audio.paused && (!context || context.state === "running")))
  }

  function play() {
    if (off) return

    if (AudioContext && !context) {
      try {
        context = new AudioContext()
        const gain = context.createGain()
        gain.gain.value = volume
        gain.connect(context.destination)
        context.createMediaElementSource(audio).connect(gain)
        context.addEventListener("statechange", syncButton)
      } catch {
        context = null
      }
    }

    if (context) {
      if (context.state !== "running") context.resume().catch(() => {})
    } else {
      audio.volume = volume
    }
    audio.play().catch(() => {})
  }

  function unlock(event) {
    if (!event.isTrusted || button.contains(event.target)) return
    if (event.type === "keydown" && (event.repeat || !["Enter", " "].includes(event.key))) return
    play()
  }

  button.addEventListener("click", () => {
    off = button.getAttribute("aria-pressed") === "true"
    try {
      localStorage.setItem(key, off ? "1" : "0")
    } catch {}
    if (off) audio.pause()
    else play()
    syncButton()
  })
  audio.addEventListener("playing", syncButton)
  audio.addEventListener("pause", syncButton)
  audio.addEventListener("error", syncButton)
  document.addEventListener("click", unlock)
  document.addEventListener("keydown", unlock)
  play()
})()
