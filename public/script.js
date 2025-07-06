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
    timeLeft = 30;
    timerEl.textContent = timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            playTimeUpSound();
            feedback.textContent = "⏰ Time's up!";
        }
    }, 1000);
    speak(questions[currentQuestionIndex].word);
};

// function to play a “time’s up” sound
function playTimeUpSound() {
  const audio = new Audio("/sounds/time-up.mp3");
  audio.play();
}


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


loadQuestions();

