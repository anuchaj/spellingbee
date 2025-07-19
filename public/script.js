// ========== DOM Elements ==========
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
const scoreboard = document.getElementById("scoreboard");
const resetScoresBtn = document.getElementById("reset-scores-btn");
const startContestBtn = document.getElementById("start-contest-btn");
const participantCountSelect = document.getElementById("participant-count");
const endContestBtn = document.getElementById("end-contest-btn"); // NEW
const turnMessageEl = document.getElementById("turn-message");
const categorySelect = document.getElementById("category-select");

// ========== State Variables ==========
let questions = [];
let currentQuestionIndex = -1;
let timer;
let timeLeft = 30;
let currentCategory = "";
let participants = [];
let currentParticipant = 0;
let contestStarted = false;
let timerRunning = false; // NEW: Prevent multiple spell clicks

// ========== Load Alphabet Buttons ==========
alphabet.forEach(letter => {
  const btn = document.createElement("button");
  btn.textContent = letter;
  btn.onclick = () => {
    speak(letter);
    spellingInput.value += letter.toLowerCase();
  };
  alphabetContainer.appendChild(btn);
});

// ========== Speak helper function (pronounces word or letter) ==========
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}

// ========== Load and Display Categories ==========
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
  await loadQuestions(); // Load questions after categories
}

categorySelect.onchange = () => {
  currentCategory = categorySelect.value;
  loadQuestions();
};

// ========== Load and Render Questions from Current Category ==========
async function loadQuestions() {
  const res = await fetch(`/api/questions?category=${currentCategory}`);
  questions = await res.json();
  renderQuestionGrid();
}

// ========== Render Question Number Buttons ==========
function renderQuestionGrid() {
  questionsGrid.innerHTML = "";
  questions.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => selectQuestion(i);
    questionsGrid.appendChild(btn);
  });
}

// ========== Select Question and Show Details ==========
function selectQuestion(index) {
  if (timerRunning) return; // prevent switching question mid-timer
  currentQuestionIndex = index;
  const question = questions[index];
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = question.definition;
  questionDisplay.textContent = `Qn: ${index + 1}`;
  speak(question.word); // Read word aloud
}

// ========== Start Pronunciation + Timer ==========
spellBtn.onclick = () => {
  if (currentQuestionIndex === -1) return alert("Select a question!");
  if (timerRunning) return; // Prevent multiple clicks
  startTimer();
  speak(questions[currentQuestionIndex].word);
};

// ========== Start Countdown Timer with Fade Effect ==========
function startTimer() {
  if (timerRunning) return; // Prevent multiple clicks
  timeLeft = 30;
  timerEl.textContent = timeLeft;
  timerEl.classList.add("fade"); // visual countdown effect

  timerRunning = true;
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      timerRunning = false;
      playTimeUpSound();
      feedback.textContent = "⏰ Time's up!";

      if (contestStarted) {
        participants[currentParticipant].score += 0;
        nextParticipant();
        renderScoreboard();
        flashTurnMessage(`Now it's ${participants[currentParticipant].name}'s turn`);
      }
    }
  }, 1000);
}

// ========== Check User Answer ==========
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
      flashTurnMessage(`Now it's ${participants[currentParticipant].name}'s turn`);
    }

    renderScoreboard();

    // Check if all questions are completed
    if ([...questionsGrid.children].every(btn => btn.disabled)) {
      endContest();
    }
  } else {
    feedback.textContent = "❌ Wrong! Try again before time runs out.";
    playSound("wrong");
    gridBtn.style.backgroundColor = "red";
  }
};

// ========== Flash Turn Change Message ==========
function flashTurnMessage(message) {
  turnMessageEl.textContent = message;
  turnMessageEl.classList.remove("hidden");
  turnMessageEl.classList.add("show");
  setTimeout(() => {
    turnMessageEl.classList.remove("show");
    setTimeout(() => turnMessageEl.classList.add("hidden"), 500);
  }, 1500);
}

// ========== Move to Next Player ==========
function nextParticipant() {
  currentParticipant = (currentParticipant + 1) % participants.length;
}

// ========== Start Contest ==========
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
  flashTurnMessage(`Contest started! ${participants[currentParticipant].name}, you're up first!`);
};

// ========== Reset Button ==========
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

// ========== Render Player Scores ==========
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

// ========== Reset Scores ==========
resetScoresBtn.onclick = () => {
  participants.forEach(p => p.score = 0);
  currentParticipant = 0;
  contestStarted = false;
  renderScoreboard();
};

// ========== Manually End Contest ==========
endContestBtn.onclick = () => {
  endContest();
};

// ========== End Contest & Announce Winner(s) ==========
function endContest() {
  contestStarted = false;
  clearInterval(timer);
  timerRunning = false;

  const maxScore = Math.max(...participants.map(p => p.score));
  const winners = participants.filter(p => p.score === maxScore);

  winners.forEach(p => {
    const pDiv = [...scoreboard.children].find(div =>
      div.textContent.includes(p.name)
    );
    if (pDiv) {
      pDiv.style.background = "green";
      pDiv.style.color = "white";
    }
  });

  setTimeout(() => {
    speak(`Contest Over. Winner${winners.length > 1 ? 's are' : ' is'} ${winners.map(w => w.name).join(", ")}`);
    alert(`🎉 Winner${winners.length > 1 ? 's' : ''}: ${winners.map(w => w.name).join(", ")}`);
  }, 500);
}

// ========== Sound Effects ==========
function playSound(type) {
  let audio;
  if (type === "correct") {
    audio = new Audio("/sounds/correct.mp3");
  } else if (type === "wrong") {
    audio = new Audio("/sounds/wrong.mp3");
  }
  if (audio) audio.play();
}

function applauseSound(type) {
  if (type === "applause") {
    const audio = new Audio("/sounds/applause.mp3");
    audio.play();
  }
}

function playTimeUpSound() {
  const audio = new Audio("/sounds/time-up.mp3");
  audio.play();
}

// ========== On Page Load ==========
document.addEventListener("DOMContentLoaded", () => {
  loadCategories(); // loads categories and questions
});
