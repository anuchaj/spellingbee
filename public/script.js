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

let questions = [];
let currentQuestionIndex = -1;
let timer;
let timeLeft = 30;

let currentCategory = "";
let participants = [];
let currentParticipant = 0;
let contestStarted = false;


// Initialize A-Z buttons 
alphabet.forEach(letter => {
  const btn = document.createElement("button");
  btn.textContent = letter;
  btn.onclick = () => {
    speak(letter);
    spellingInput.value += letter.toLowerCase();
  };
  alphabetContainer.appendChild(btn);
});

// Speak helper
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}

// Load questions
async function loadQuestions() {
  const res = await fetch("/api/questions");
  questions = await res.json();
  renderQuestionGrid();
}

// Render Q1–Qn Grid
function renderQuestionGrid() {
  questionsGrid.innerHTML = "";
  questions.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => selectQuestion(i);
    questionsGrid.appendChild(btn);
  });
}

function selectQuestion(index) {
  currentQuestionIndex = index;
  const question = questions[index];
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = question.definition;
  questionDisplay.textContent = `Qn: ${index + 1}`;
  speak(question.word); // pronounce word on select
}

spellBtn.onclick = () => {
  if (currentQuestionIndex === -1) return alert("Select a question!");
  startTimer();
  speak(questions[currentQuestionIndex].word);
};

function startTimer() {
  timeLeft = 30;
  timerEl.textContent = timeLeft;

  clearInterval(timer); // Prevent multiple timers
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      playTimeUpSound();
      feedback.textContent = "⏰ Time's up!";

      if (contestStarted) {
        participants[currentParticipant].score += 0; // Explicit zero score
        nextParticipant();
        renderScoreboard();
      }
    }
  }, 1000);
}


// function to play a “time’s up” sound
function playTimeUpSound() {
  const audio = new Audio("/sounds/time-up.mp3");
  audio.play();
}

/*
checkBtn.onclick = () => {

    const userAnswer = spellingInput.value.trim().toLowerCase();
    const correct = questions[currentQuestionIndex].word.toLowerCase();
    const gridBtn = questionsGrid.children[currentQuestionIndex];

        if (userAnswer === correct) {
            feedback.textContent = "✅ Correct!";
            gridBtn.disabled = true;
            gridBtn.style.backgroundColor = "green";
            playSound("correct");
            applauseSound("applause");
        } else {
            feedback.textContent = "❌ Wrong!";
            gridBtn.style.backgroundColor = "red";
            playSound("wrong");
        }

    clearInterval(timer);
};
*/


checkBtn.onclick = () => {
  const userAnswer = spellingInput.value.trim().toLowerCase();
  const correct = questions[currentQuestionIndex].word.toLowerCase();
  const gridBtn = questionsGrid.children[currentQuestionIndex];

  if (userAnswer === correct) {
    clearInterval(timer); // ✅ Stop only if correct
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

    // Check if all questions are completed
    if ([...questionsGrid.children].every(btn => btn.disabled)) {
      endContest();
    }
  } else {
    feedback.textContent = "❌ Wrong! Try again before time runs out.";
    playSound("wrong");
    gridBtn.style.backgroundColor = "red";

    // DO NOT clearInterval(timer) here.
    // Allow retries if time remains.
    if (timeLeft <= 0 && contestStarted) {
      nextParticipant();
      renderScoreboard();
    }
  }
};


function nextParticipant() {
  currentParticipant = (currentParticipant + 1) % participants.length;
}


function endContest() {
  contestStarted = false;
  const maxScore = Math.max(...participants.map(p => p.score));
  const winners = participants.filter(p => p.score === maxScore);

  winners.forEach(p => {
    const pDiv = [...scoreboard.children].find(div =>
      div.textContent.includes(p.name)
    );
    if (pDiv) pDiv.style.background = "green", pDiv.style.color = "white";
  });

  setTimeout(() => {
    speak(`Contest Over. Winner${winners.length > 1 ? 's are' : ' is'} ${winners.map(w => w.name).join(", ")}`);
    alert(`🎉 Winner${winners.length > 1 ? 's' : ''}: ${winners.map(w => w.name).join(", ")}`);
  }, 500);
}


document.getElementById("reset-btn").onclick = () => {
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = "";
  questionDisplay.textContent = "Qn: -";
  clearInterval(timer);
  timerEl.textContent = "30";

  // Reset button colors and disable states
  [...questionsGrid.children].forEach(btn => {
    btn.disabled = false;
    btn.style.backgroundColor = "";
  });
};

const startContestBtn = document.getElementById("start-contest-btn");
const participantCountSelect = document.getElementById("participant-count");
const scoreboard = document.getElementById("scoreboard");
const resetScoresBtn = document.getElementById("reset-scores-btn");

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

resetScoresBtn.onclick = () => {
  participants.forEach(p => p.score = 0);
  currentParticipant = 0;
  contestStarted = false;
  renderScoreboard();
};


function playSound(type) {
  let audio;
  if (type === "correct") {
    audio = new Audio("/sounds/correct.mp3");
  } else if (type === "wrong") {
    audio = new Audio("/sounds/wrong.mp3");
  }
  if (audio) audio.play();
}

// This function can be combined with playSound() function
function applauseSound(type) {
  let audio2;
  if (type === "applause") {
    audio2 = new Audio("/sounds/applause.mp3");
  } 
  if (audio2) audio2.play();
}


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
  loadQuestions(); // load questions after category loaded
}

categorySelect.onchange = () => {
  currentCategory = categorySelect.value;
  loadQuestions();
};
// loadQuestions();

async function loadQuestions() {
  const res = await fetch(`/api/questions?category=${currentCategory}`);
  questions = await res.json();
  renderQuestionGrid();
}


// Ensure category and questions load on page load
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

