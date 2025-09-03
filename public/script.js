// ========== DOM Elements or constants ==========
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-".split("");
const alphabetContainer = document.getElementById("alphabet");
const questionDisplay = document.getElementById("current-question");
const timerEl = document.getElementById("timer");
const spellingInput = document.getElementById("spelling-input");
const feedback = document.getElementById("feedback");
const definitionEl = document.getElementById("definition");
const sentenceEl = document.getElementById("sentence");
const spellBtn = document.getElementById("spell-btn");
const checkBtn = document.getElementById("check-btn");
const questionsGrid = document.getElementById("questions-grid");
const scoreboard = document.getElementById("scoreboard");
const resetScoresBtn = document.getElementById("reset-scores-btn");
const startContestBtn = document.getElementById("start-contest-btn");
const participantCountSelect = document.getElementById("participant-count");
const endContestBtn = document.getElementById("end-contest-btn");
const turnMessageEl = document.getElementById("turn-message");
const categorySelect = document.getElementById("category-select");
const correctSpelling = document.getElementById("answer-correct");

// New elements for participants management
const studentsList = document.getElementById("students");
const addParticipantBtn = document.getElementById("add-participant-btn");
const submitParticipantsBtn = document.getElementById("submit-participants-btn");

// ========== State Variables ==========
let questions = [];
let currentQuestionIndex = -1;
let timer;
let timeLeft = 30;
let currentCategory = "";
let participants = [];
let currentParticipant = 0;
let contestStarted = false;
let timerRunning = false;
let correctWord = "";
let setupMode = false; // true when user is editing participants before contest

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

// ========== Speak helper ==========
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
  await loadQuestions();
}

categorySelect.onchange = () => {
  currentCategory = categorySelect.value;
  loadQuestions();
};

// ========== Load and Render Questions ==========
async function loadQuestions() {
  const res = await fetch(`/api/questions?category=${currentCategory}`);
  questions = await res.json();
  renderQuestionGrid();
}

// ========== Render Question Grid ==========
function renderQuestionGrid() {
  questionsGrid.innerHTML = "";
  questions.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => selectQuestion(i);
    questionsGrid.appendChild(btn);
  });
}

// ========== Select Question ==========
function selectQuestion(index) {
  if (timerRunning) return;
  currentQuestionIndex = index;
  const question = questions[index];
  correctWord = question.word;
  correctSpelling.textContent = "";
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = `Definition: ${question.definition}`;
  sentenceEl.textContent = `Sentence: ${question.sentence}`;
  questionDisplay.textContent = `Qn: ${index + 1}`;
  speak(question.word);
}

// ========== Spelling + Timer ==========
spellBtn.onclick = () => {
  if (currentQuestionIndex === -1) return alert("Select a question!");
  if (timerRunning) return;
  startTimer();
  speak(questions[currentQuestionIndex].word);
};

function startTimer() {
  if (timerRunning) return;
  timeLeft = 15;
  timerEl.textContent = `Timer: ${timeLeft}`;
  timerEl.classList.add("fade");

  spellingInput.disabled = false;

  timerRunning = true;
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Timer: ${timeLeft}`;

    if (timeLeft <= 0) {
      correctSpelling.textContent = correctWord;
      clearInterval(timer);
      timerRunning = false;
      playTimeUpSound();
      feedback.textContent = "⏰ Time's up!";
      checkAnswer();
      spellingInput.disabled = true;
    }
  }, 1000);
}

// ========== Answer Checking ==========
function checkAnswer() {
  const userAnswer2 = spellingInput.value.trim().toLowerCase();
  const correct2 = questions[currentQuestionIndex].word.toLowerCase();
  const gridBtn2 = questionsGrid.children[currentQuestionIndex];

  if (userAnswer2 === correct2) {
    clearInterval(timer);
    timerRunning = false;
    feedback.textContent = "✅ Correct!";
    playSound("correct");
    applauseSound("applause");
    gridBtn2.disabled = true;
    gridBtn2.style.backgroundColor = "green";
    spellingInput.disabled = true;

    if (contestStarted) {
      participants[currentParticipant].score += 2;
      nextParticipant();
      flashTurnMessage(`Now it's ${participants[currentParticipant].name}'s turn`);
    }
    renderScoreboard();
  } else {
    
    if (contestStarted) {
      participants[currentParticipant].score += 0;
      nextParticipant();
      renderScoreboard();
      flashTurnMessage(`Now it's ${participants[currentParticipant].name}'s turn`);
    }
    feedback.textContent = "❌ Wrong! Try again later.";
    playSound("wrong");
    gridBtn2.style.backgroundColor = "red";
    gridBtn2.disabled = true;
    spellingInput.disabled = true;
  }
}

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
    correctSpelling.innerHTML = correct.toUpperCase();
    spellingInput.disabled = true;

    if (contestStarted) {
      participants[currentParticipant].score += 2;
      nextParticipant();
      flashTurnMessage(`Now it's ${participants[currentParticipant].name}'s turn`);
    }
    renderScoreboard();
  } else {
    feedback.textContent = "❌ Wrong! Try again before time runs out.";
    playSound("wrong");
    gridBtn.style.backgroundColor = "red";
    gridBtn.disabled = true;
  }
};

// ========== Flash Turn Message ==========
function flashTurnMessage(message) {
  turnMessageEl.textContent = message;
  turnMessageEl.classList.remove("hidden");
  turnMessageEl.classList.add("show");
  setTimeout(() => {
    turnMessageEl.classList.remove("show");
    setTimeout(() => turnMessageEl.classList.add("hidden"), 500);
  }, 1500);
}

// ========== Participant Management ==========
function renderStudentsList() {
  studentsList.innerHTML = "";
  participants.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${i + 1}. <span>${p.name}</span>
      <button onclick="editParticipant(${i})">✏️</button>
      <button onclick="removeParticipant(${i})">❌</button>`;
    studentsList.appendChild(li);
  });
}

function addParticipant() {
  const id = participants.length + 1;
  participants.push({ id, name: `P${id}`, score: 0 });
  renderStudentsList();
}

function editParticipant(index) {
  const newName = prompt("Enter new name:", participants[index].name);
  if (newName) {
    participants[index].name = newName;
    renderStudentsList();
  }
}

function removeParticipant(index) {
  participants.splice(index, 1);
  renderStudentsList();
}

// ========== Start Contest ==========
startContestBtn.onclick = () => {
  const count = parseInt(participantCountSelect.value);
  const useCustom = confirm("Do you want to enter custom participant names?");

  if (useCustom) {
    // Setup mode
    participants = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `P${i + 1}`,
      score: 0
    }));
    setupMode = true;
    renderStudentsList();
    addParticipantBtn.style.display = "inline-block";
    submitParticipantsBtn.style.display = "inline-block";
  } else {
    // Default start
    participants = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `P${i + 1}`,
      score: 0
    }));
    beginContest();
  }
};

addParticipantBtn.onclick = () => addParticipant();
submitParticipantsBtn.onclick = () => beginContest();

function beginContest() {
  setupMode = false;
  currentParticipant = 0;
  contestStarted = true;
  renderScoreboard();
  renderStudentsList();
  flashTurnMessage(`Contest started! ${participants[currentParticipant].name}, you're up first!`);

  // Hide setup buttons
  addParticipantBtn.style.display = "none";
  submitParticipantsBtn.style.display = "none";
  startContestBtn.disabled = true;
  endContestBtn.style.display = "inline-block";
}

// ========== Next Player ==========
function nextParticipant() {
  currentParticipant = (currentParticipant + 1) % participants.length;
}

// ========== Reset & Scores ==========
document.getElementById("reset-btn").onclick = () => {
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = "";
  sentenceEl.textContent = "";
  correctSpelling.textContent = "";
  questionDisplay.textContent = "Qn: -";
  clearInterval(timer);
  timerRunning = false;
  timerEl.textContent = "Timer: 30";

  [...questionsGrid.children].forEach(btn => {
    btn.disabled = false;
    btn.style.backgroundColor = "";
  });
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
  // Reset scores
  participants.forEach(p => (p.score = 0));

  // Reset turn to first participant
  currentParticipant = 0;

  // Keep contest running
  contestStarted = true;

  // Reset question grid
  [...questionsGrid.children].forEach(btn => {
    btn.disabled = false;
    btn.style.backgroundColor = "";
  });

  // Reset input and feedback fields
  spellingInput.value = "";
  feedback.textContent = "";
  definitionEl.textContent = "";
  sentenceEl.textContent = "";
  correctSpelling.textContent = "";
  questionDisplay.textContent = "Qn: -";
  clearInterval(timer);
  timerRunning = false;
  timerEl.textContent = "Timer: 30";

  // Update UI
  renderScoreboard();
  renderStudentsList();
  flashTurnMessage(`Scores reset! ${participants[currentParticipant].name}, it's your turn again.`);
};


endContestBtn.onclick = () => {
  endContest();
};

function endContest() {
  contestStarted = false;
  clearInterval(timer);
  timerRunning = false;

  startContestBtn.disabled = false;
  endContestBtn.style.display = "none";

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
    speak(
      `Contest Over. Winner${winners.length > 1 ? "s are" : " is"} ${winners
        .map(w => w.name)
        .join(", ")}`
    );
    alert(
      `🎉 Winner${winners.length > 1 ? "s" : ""}: ${winners
        .map(w => w.name)
        .join(", ")}`
    );
  }, 500);
}

// ========== Sounds ==========
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


// ========== Responsive Nav Toggle ==========
const hamburger = document.getElementById("hamburger-menu");
const nav = document.querySelector("nav");

hamburger.addEventListener("click", () => {
  nav.classList.toggle("responsive");

  // Toggle icon between ☰ and ✖
  if (nav.classList.contains("responsive")) {
    hamburger.innerHTML = "&#10005;"; // ✖
  } else {
    hamburger.innerHTML = "&#9776;"; // ☰
  }
});

// ========== Click Outside to Close ==========
document.addEventListener("click", (e) => {
  const isClickInside = nav.contains(e.target);
  const isHamburgerClick = hamburger.contains(e.target);

  if (!isClickInside && !isHamburgerClick && nav.classList.contains("responsive")) {
    nav.classList.remove("responsive");
    hamburger.innerHTML = "&#9776;";
  }
});

// ========== Keyboard Accessibility ==========
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("responsive")) {
    nav.classList.remove("responsive");
    hamburger.innerHTML = "&#9776;";
    hamburger.focus();
  }

  // Trap focus within nav when open
  if (nav.classList.contains("responsive") && e.key === "Tab") {
    const focusableSelectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = nav.querySelectorAll(focusableSelectors);
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
});



// ========== Init ==========
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});
