// ========== DOM Elements ==========
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-".split(""); // Array of alphabet letters and hyphen
const alphabetContainer = document.getElementById("alphabet"); // Container for alphabet buttons
const questionDisplay = document.getElementById("current-question"); // Display for current question number
const timerEl = document.getElementById("timer"); // Timer display element
const spellingInput = document.getElementById("spelling-input"); // Input field for spelling
const feedback = document.getElementById("feedback"); // Feedback message display
const definitionEl = document.getElementById("definition"); // Definition display
const spellBtn = document.getElementById("spell-btn"); // Button to start spelling
const checkBtn = document.getElementById("check-btn"); // Button to check answer
const questionsGrid = document.getElementById("questions-grid"); // Grid for question number buttons
const scoreboard = document.getElementById("scoreboard"); // Scoreboard display
const resetScoresBtn = document.getElementById("reset-scores-btn"); // Button to reset scores
const startContestBtn = document.getElementById("start-contest-btn"); // Button to start contest
const participantCountSelect = document.getElementById("participant-count"); // Dropdown for participant count
const endContestBtn = document.getElementById("end-contest-btn"); // Button to end contest
const turnMessageEl = document.getElementById("turn-message"); // Display for turn change messages
const categorySelect = document.getElementById("category-select"); // Dropdown for category selection

// ========== State Variables ==========
let questions = []; // Array to store questions
let currentQuestionIndex = -1; // Index of current question
let timer; // Timer variable
let timeLeft = 30; // Time limit for each question
let currentCategory = ""; // Current selected category
let participants = []; // Array to store participant data
let currentParticipant = 0; // Index of current participant
let contestStarted = false; // Flag to track if contest is active
let timerRunning = false; // Flag to prevent multiple spell clicks

// ========== Load Alphabet Buttons ==========
alphabet.forEach(letter => {
  const btn = document.createElement("button"); // Create button for each letter
  btn.textContent = letter; // Set button text to letter
  btn.onclick = () => { // Add click event to append letter to input
    speak(letter); // Speak the letter
    spellingInput.value += letter.toLowerCase(); // Append lowercase letter to input
  };
  alphabetContainer.appendChild(btn); // Add button to container
});

// ========== Speak helper function (pronounces word or letter) ==========
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text); // Create speech utterance
  window.speechSynthesis.speak(msg); // Speak the text
}

// ========== Load and Display Categories ==========
async function loadCategories() {
  const res = await fetch("/api/categories"); // Fetch categories from API
  const cats = await res.json(); // Parse JSON response

  categorySelect.innerHTML = ""; // Clear existing options
  cats.forEach(cat => {
    const opt = document.createElement("option"); // Create option element
    opt.value = cat._id; // Set option value to category ID
    opt.textContent = cat.category_name; // Set option text to category name
    categorySelect.appendChild(opt); // Add option to select
    if (cat.isDefault) currentCategory = cat._id; // Set default category
  });

  categorySelect.value = currentCategory; // Set select to current category
  await loadQuestions(); // Load questions for current category
}

// ========== Handle Category Change ==========
categorySelect.onchange = () => {
  currentCategory = categorySelect.value; // Update current category
  loadQuestions(); // Load questions for new category
};

// ========== Load and Render Questions from Current Category ==========
async function loadQuestions() {
  const res = await fetch(`/api/questions?category=${currentCategory}`); // Fetch questions for category
  questions = await res.json(); // Parse JSON response
  renderQuestionGrid(); // Render question grid
}

// ========== Render Question Number Buttons ==========
function renderQuestionGrid() {
  questionsGrid.innerHTML = ""; // Clear existing buttons
  questions.forEach((q, i) => {
    const btn = document.createElement("button"); // Create button for question
    btn.textContent = i + 1; // Set button text to question number
    btn.onclick = () => selectQuestion(i); // Add click event to select question
    questionsGrid.appendChild(btn); // Add button to grid
  });
}

// ========== Select Question and Show Details ==========
function selectQuestion(index) {
  if (timerRunning) return; // Prevent switching question during timer
  currentQuestionIndex = index; // Set current question index
  const question = questions[index]; // Get question data
  spellingInput.value = ""; // Clear input field
  feedback.textContent = ""; // Clear feedback
  definitionEl.textContent = question.definition; // Display definition
  questionDisplay.textContent = `Qn: ${index + 1}`; // Display question number
  speak(question.word); // Speak the word
}

// ========== Start Pronunciation + Timer ==========
spellBtn.onclick = () => {
  if (currentQuestionIndex === -1) return alert("Select a question!"); // Alert if no question selected
  if (timerRunning) return; // Prevent multiple clicks
  startTimer(); // Start timer
  speak(questions[currentQuestionIndex].word); // Speak current word
};

// ========== Start Countdown Timer with Fade Effect ==========
function startTimer() {
  if (timerRunning) return; // Prevent multiple timers
  timeLeft = 30; // Reset time
  timerEl.textContent = timeLeft; // Update timer display
  timerEl.classList.add("fade"); // Add fade effect

  timerRunning = true; // Set timer running flag
  clearInterval(timer); // Clear any existing timer
  timer = setInterval(() => { // Start new timer
    timeLeft--; // Decrease time
    timerEl.textContent = timeLeft; // Update display

    if (timeLeft <= 0) { // If time runs out
      clearInterval(timer); // Stop timer
      timerRunning = false; // Reset timer flag
      playTimeUpSound(); // Play time-up sound
      feedback.textContent = "⏰ Time's up!"; // Show time-up message

      if (contestStarted) { // If contest is active
        participants[currentParticipant].score += 0; // No points for time-out
        nextParticipant(); // Move to next participant
        renderScoreboard(); // Update scoreboard
        flashTurnMessage(`Now it's ${participants[currentParticipant].name}'s turn`); // Show turn message
      }
    }
  }, 1000); // Run every second
}

// ========== Check User Answer ==========
checkBtn.onclick = () => {
  if (timerRunning === false) return; // Only check if timer is running
  
  const userAnswer = spellingInput.value.trim().toLowerCase(); // Get user input
  const correct = questions[currentQuestionIndex].word.toLowerCase(); // Get correct answer
  const gridBtn = questionsGrid.children[currentQuestionIndex]; // Get question button

  if (userAnswer === correct) { // If answer is correct
    clearInterval(timer); // Stop timer
    timerRunning = false; // Reset timer flag
    feedback.textContent = "✅ Correct!"; // Show correct feedback
    playSound("correct"); // Play correct sound
    applauseSound("applause"); // Play applause sound
    gridBtn.disabled = true; // Disable question button
    gridBtn.style.backgroundColor = "green"; // Mark button green

    if (contestStarted) { // If contest is active
      participants[currentParticipant].score += 2; // Add points
      nextParticipant(); // Move to next participant
      flashTurnMessage(`Now it's ${participants[currentParticipant].name}'s turn`); // Show turn message
    }

    renderScoreboard(); // Update scoreboard
  } else { // If answer is wrong
    feedback.textContent = "❌ Wrong! Try again before time runs out."; // Show wrong feedback
    playSound("wrong"); // Play wrong sound
    gridBtn.style.backgroundColor = "red"; // Mark button red
  }
};

// ========== Flash Turn Change Message ==========
function flashTurnMessage(message) {
  turnMessageEl.textContent = message; // Set message text
  turnMessageEl.classList.remove("hidden"); // Show message
  turnMessageEl.classList.add("show"); // Add show animation
  setTimeout(() => { // After 1.5 seconds
    turnMessageEl.classList.remove("show"); // Remove show animation
    setTimeout(() => turnMessageEl.classList.add("hidden"), 500); // Hide after fade
  }, 1500);
}

// ========== Move to Next Player ==========
function nextParticipant() {
  currentParticipant = (currentParticipant + 1) % participants.length; // Cycle to next participant
}

// ========== Start Contest ==========
startContestBtn.onclick = () => {
  const count = parseInt(participantCountSelect.value); // Get participant count
  participants = Array.from({ length: count }, (_, i) => ({ // Initialize participants
    id: i + 1,
    name: `P${i + 1}`,
    score: 0
  }));
  currentParticipant = 0; // Start with first participant
  contestStarted = true; // Set contest flag
  renderScoreboard(); // Update scoreboard
  flashTurnMessage(`Contest started! ${participants[currentParticipant].name}, you're up first!`); // Show start message
};

// ========== Reset Button ==========
document.getElementById("reset-btn").onclick = () => {
  spellingInput.value = ""; // Clear input
  feedback.textContent = ""; // Clear feedback
  definitionEl.textContent = ""; // Clear definition
  questionDisplay.textContent = "Qn: -"; // Reset question display
  clearInterval(timer); // Stop timer
  timerRunning = false; // Reset timer flag
  timerEl.textContent = "30"; // Reset timer display

  [...questionsGrid.children].forEach(btn => { // Reset question buttons
    btn.disabled = false; // Enable button
    btn.style.backgroundColor = ""; // Clear color
  });
};

// ========== Render Player Scores ==========
function renderScoreboard() {
  scoreboard.innerHTML = ""; // Clear scoreboard
  participants.forEach((p, i) => { // For each participant
    const div = document.createElement("div"); // Create div
    div.className = "participant"; // Set class
    if (i === currentParticipant) div.classList.add("active"); // Highlight current participant
    div.innerHTML = `<strong>${p.name}</strong><br>Score: ${p.score}`; // Set participant info
    scoreboard.appendChild(div); // Add to scoreboard
  });
}

// ========== Reset Scores ==========
resetScoresBtn.onclick = () => {
  participants.forEach(p => p.score = 0); // Reset all scores
  currentParticipant = 0; // Reset to first participant
  contestStarted = false; // End contest
  renderScoreboard(); // Update scoreboard
};

// ========== Manually End Contest ==========
endContestBtn.onclick = () => {
  endContest(); // Call end contest function
};

// ========== End Contest & Announce Winner(s) ==========
function endContest() {
  contestStarted = false; // End contest
  clearInterval(timer); // Stop timer
  timerRunning = false; // Reset timer flag

  const maxScore = Math.max(...participants.map(p => p.score)); // Find highest score
  const winners = participants.filter(p => p.score === maxScore); // Find all winners

  winners.forEach(p => { // Highlight winners
    const pDiv = [...scoreboard.children].find(div =>
      div.textContent.includes(p.name)
    );
    if (pDiv) {
      pDiv.style.background = "green"; // Set winner background
      pDiv.style.color = "white"; // Set winner text color
    }
  });

  setTimeout(() => { // Announce winners after delay
    speak(`Contest Over. Winner${winners.length > 1 ? 's are' : ' is'} ${winners.map(w => w.name).join(", ")}`); // Speak winner(s)
    alert(`🎉 Winner${winners.length > 1 ? 's' : ''}: ${winners.map(w => w.name).join(", ")}`); // Show winner alert
  }, 500);
}

// ========== Sound Effects ==========
function playSound(type) {
  let audio; // Audio variable
  if (type === "correct") {
    audio = new Audio("/sounds/correct.mp3"); // Correct sound
  } else if (type === "wrong") {
    audio = new Audio("/sounds/wrong.mp3"); // Wrong sound
  }
  if (audio) audio.play(); // Play sound if defined
}

function applauseSound(type) {
  if (type === "applause") {
    const audio = new Audio("/sounds/applause.mp3"); // Applause sound
    audio.play(); // Play applause
  }
}

function playTimeUpSound() {
  const audio = new Audio("/sounds/time-up.mp3"); // Time-up sound
  audio.play(); // Play time-up sound
}

// ========== On Page Load ==========
document.addEventListener("DOMContentLoaded", () => {
  loadCategories(); // Load categories and questions on page load
});