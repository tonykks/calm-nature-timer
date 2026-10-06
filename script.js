const minLimit = 1;
const maxLimit = 30;
const defaultMinutes = 5;

const state = {
  totalSeconds: defaultMinutes * 60,
  remainingSeconds: defaultMinutes * 60,
  intervalId: null,
  isRunning: false,
  soundEnabled: true,
};

const timeDisplay = document.getElementById("timeDisplay");
const minuteValue = document.getElementById("minuteValue");
const statusText = document.getElementById("statusText");
const soundToggle = document.getElementById("soundToggle");

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function render() {
  timeDisplay.textContent = formatTime(state.remainingSeconds);
  minuteValue.textContent = `${Math.ceil(state.remainingSeconds / 60)}분`;
}

function setTargetMinutes(minutes) {
  const safeMinutes = Math.min(Math.max(minutes, minLimit), maxLimit);
  state.totalSeconds = safeMinutes * 60;
  state.remainingSeconds = safeMinutes * 60;
  state.isRunning = false;
  clearInterval(state.intervalId);
  state.intervalId = null;
  statusText.textContent = "대기 중";
  render();
  updatePresetHighlight();
}

function updatePresetHighlight() {
  document.querySelectorAll(".preset-btn").forEach((button) => {
    const isActive = Number(button.dataset.minutes) === Math.ceil(state.remainingSeconds / 60);
    button.classList.toggle("active", isActive);
  });
}

function startTimer() {
  if (state.remainingSeconds <= 0) {
    state.remainingSeconds = state.totalSeconds;
  }

  if (state.isRunning) {
    return;
  }

  state.isRunning = true;
  statusText.textContent = "타이머 작동 중";

  state.intervalId = setInterval(() => {
    if (state.remainingSeconds > 0) {
      state.remainingSeconds -= 1;
      render();
      updatePresetHighlight();
    }

    if (state.remainingSeconds <= 0) {
      clearInterval(state.intervalId);
      state.intervalId = null;
      state.isRunning = false;
      statusText.textContent = "시간 종료!";
      playCompletionChime();
      timeDisplay.textContent = "00:00";
      updatePresetHighlight();
    }
  }, 1000);
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(state.intervalId);
  state.intervalId = null;
  statusText.textContent = "일시정지";
}

function resetTimer() {
  pauseTimer();
  state.remainingSeconds = state.totalSeconds;
  render();
  statusText.textContent = "대기 중";
  updatePresetHighlight();
}

function adjustMinutes(change) {
  const currentMinutes = Math.ceil(state.totalSeconds / 60);
  setTargetMinutes(currentMinutes + change);
}

function playCompletionChime() {
  if (!state.soundEnabled) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }

  const context = new AudioCtx();
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, context.currentTime + index * 0.18);
    gainNode.gain.exponentialRampToValueAtTime(0.18, context.currentTime + index * 0.18 + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.18 + 0.42);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime + index * 0.18);
    oscillator.stop(context.currentTime + index * 0.18 + 0.42);
  });

  setTimeout(() => context.close(), 1500);
}

function bindControls() {
  document.querySelectorAll(".preset-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setTargetMinutes(Number(button.dataset.minutes));
    });
  });

  document.getElementById("decreaseBtn").addEventListener("click", () => adjustMinutes(-1));
  document.getElementById("increaseBtn").addEventListener("click", () => adjustMinutes(1));
  document.getElementById("startBtn").addEventListener("click", startTimer);
  document.getElementById("pauseBtn").addEventListener("click", pauseTimer);
  document.getElementById("resetBtn").addEventListener("click", resetTimer);

  soundToggle.addEventListener("change", () => {
    state.soundEnabled = soundToggle.checked;
  });
}

render();
bindControls();
updatePresetHighlight();
