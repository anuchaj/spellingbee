// --- DOM Element References ---
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-".split("");
const alphabetContainer = document.getElementById("alphabet");
const questionDisplay = document.getElementById("current-question");
const timerEl = document.getElementById("timer");
const spellingInput = document.getElementById("spelling-input");
const feedback = document.getElementById("feedback");
const definitionEl = document.getElementById("definition");
const spellBtn = document.getElementById("spell-btn");
const checkBtn = document.getElementById("check-btn");
const questionsGrid = document.getElementById("questions-grid");
const endContestBtn = document.getElementById("end-contest-btn"); // End Contest button

// --- Game State Variables ---
let questions = [];
let currentQuestionIndex = -1;
let timer;
let timeLeft = 30;
let timerRunning = false; // Prevent double clicks
let currentCategory = "";
let participants = [];
let currentParticipant = 0;
let contestStarted = false;

// --- Initialize Alphabet Buttons A-Z ---
alphabet.forEach(letter => {
  const btn = document.createElement("button");
  btn.textContent = letter;
  btn.onclick = () => {
    speak(letter);
    spellingInput.value += letter.toLowerCase();
  };
  alphabetContainer.appendChild(btn);
});

// --- Speak helper function (pronounces word or letter) ---
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}

// --- Load and Render Questions from Current Category ---
async function loadQuestions() {
  const res = await fetch(`/api/questions?category=${currentCategory}`);
  questions = await res.json();
  renderQuestionGrid();
}

// --- Render Question Buttons (Q1–Qn) Grid ---
function renderQuestionGrid() {
  questionsGrid.innerHTML = "";
  questions.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => selectQuestion(i);
    questionsGrid.appendChild(btn);
  });
}

// --- When a question is selected ---
function selectQuestion(index) {
  if (timerRunning) return; // prevent switching question mid-timer
  currentQuestionIndex = index;
  const question = questions[index];
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = question.definition;
  questionDisplay.textContent = `Qn: ${index + 1}`;
  speak(question.word);
}

// --- Start Countdown Timer with Visual Fading ---
function startTimer() {
  if (timerRunning) return; // Prevent multiple clicks
  timeLeft = 30;
  timerEl.textContent = timeLeft;
  timerRunning = true;

  // Fade countdown effect
  timerEl.classList.add("countdown-fade");
  setTimeout(() => timerEl.classList.remove("countdown-fade"), 1000);

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    // Visual fading each second
    timerEl.classList.add("countdown-fade");
    setTimeout(() => timerEl.classList.remove("countdown-fade"), 500);

    if (timeLeft <= 0) {
      clearInterval(timer);
      timerRunning = false;
      playTimeUpSound();
      feedback.textContent = "⏰ Time's up!";

      if (contestStarted) {
        participants[currentParticipant].score += 0;
        nextParticipant();
        renderScoreboard();
      }
    }
  }, 1000);
}

// --- Time Up Sound Effect ---
function playTimeUpSound() {
  const audio = new Audio("/sounds/time-up.mp3");
  audio.play();
}

// --- SPELL Button Click: Starts Timer and Speaks Word ---
spellBtn.onclick = () => {
  if (currentQuestionIndex === -1) return alert("Select a question!");
  startTimer();
  speak(questions[currentQuestionIndex].word);
};

// --- CHECK Button Click: Validates Answer ---
checkBtn.onclick = () => {
  if (timerRunning === false) return;

  const userAnswer = spellingInput.value.trim().toLowerCase();
  const correct = questions[currentQuestionIndex].word.toLowerCase();
  const gridBtn = questionsGrid.children[currentQuestionIndex];

  if (userAnswer === correct) {
    clearInterval(timer);
    timerRunning = false;
    feedback.textContent = "✅ Correct!";
    playSound("correct");
    applauseSound("applause");

    gridBtn.disabled = true;
    gridBtn.style.backgroundColor = "green";

    if (contestStarted) {
      participants[currentParticipant].score += 2;
      nextParticipant();
    }

    renderScoreboard();

    // End contest if all questions are answered
    if ([...questionsGrid.children].every(btn => btn.disabled)) {
      endContest();
    }
  } else {
    feedback.textContent = "❌ Wrong! Try again before time runs out.";
    playSound("wrong");
    gridBtn.style.backgroundColor = "red";
  }
};

// --- Advance to Next Participant with Flash Message ---
function nextParticipant() {
  flashTurnMessage(`Switching turn to P${(currentParticipant + 1) % participants.length + 1}`);
  currentParticipant = (currentParticipant + 1) % participants.length;
}

// --- Flash message between turns ---
function flashTurnMessage(message) {
  const msgEl = document.getElementById("turn-message");
  msgEl.textContent = message;
  msgEl.classList.remove("hidden");
  msgEl.classList.add("show");

  setTimeout(() => {
    msgEl.classList.remove("show");
    setTimeout(() => msgEl.classList.add("hidden"), 500);
  }, 1500);
}

// --- Manually End Contest or Auto-End When All Done ---
function endContest() {
  contestStarted = false;
  timerRunning = false;
  clearInterval(timer);

  const maxScore = Math.max(...participants.map(p => p.score));
  const winners = participants.filter(p => p.score === maxScore);

  // Highlight winner(s)
  winners.forEach(p => {
    const pDiv = [...scoreboard.children].find(div =>
      div.textContent.includes(p.name)
    );
    if (pDiv) {
      pDiv.style.background = "green";
      pDiv.style.color = "white";
    }
  });

  // Speak and Alert Winner(s)
  setTimeout(() => {
    speak(`Contest Over. Winner${winners.length > 1 ? 's are' : ' is'} ${winners.map(w => w.name).join(", ")}`);
    alert(`🎉 Winner${winners.length > 1 ? 's' : ''}: ${winners.map(w => w.name).join(", ")}`);
  }, 500);
}

// --- END Contest Button Event ---
endContestBtn.onclick = endContest;

// --- Reset Question & Timer UI ---
document.getElementById("reset-btn").onclick = () => {
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = "";
  questionDisplay.textContent = "Qn: -";
  clearInterval(timer);
  timerRunning = false;
  timerEl.textContent = "30";

  [...questionsGrid.children].forEach(btn => {
    btn.disabled = false;
    btn.style.backgroundColor = "";
  });
};

// --- Start Contest ---
const startContestBtn = document.getElementById("start-contest-btn");
const participantCountSelect = document.getElementById("participant-count");
const scoreboard = document.getElementById("scoreboard");

startContestBtn.onclick = () => {
  const count = parseInt(participantCountSelect.value);
  participants = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
    score: 0
  }));
  currentParticipant = 0;
  contestStarted = true;
  renderScoreboard();
};

// --- Display Participant Scores ---
function renderScoreboard() {
  scoreboard.innerHTML = "";
  participants.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "participant";
    if (i === currentParticipant) div.classList.add("active");
    div.innerHTML = `<strong>${p.name}</strong><br>Score: ${p.score}`;
    scoreboard.appendChild(div);
  });
}

// --- Reset Scores Only ---
const resetScoresBtn = document.getElementById("reset-scores-btn");
resetScoresBtn.onclick = () => {
  participants.forEach(p => p.score = 0);
  currentParticipant = 0;
  contestStarted = false;
  renderScoreboard();
};

// --- Sound Effects ---
function playSound(type) {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.play();
}
function applauseSound(type) {
  if (type === "applause") {
    const audio = new Audio("/sounds/applause.mp3");
    audio.play();
  }
}

// --- Load Categories Dropdown ---
const categorySelect = document.getElementById("category-select");

async function loadCategories() {
  const res = await fetch("/api/categories");
  const cats = await res.json();

  categorySelect.innerHTML = "";
  cats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat._id;
    opt.textContent = cat.category_name;
    categorySelect.appendChild(opt);
    if (cat.isDefault) currentCategory = cat._id;
  });

  categorySelect.value = currentCategory;
  loadQuestions();
}

// --- When category changes, reload questions ---
categorySelect.onchange = () => {
  currentCategory = categorySelect.value;
  loadQuestions();
};

// --- On Page Load ---
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});
