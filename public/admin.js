const API_URL = "/api/questions";
const form = document.getElementById("question-form");
const wordInput = document.getElementById("word");
const definitionInput = document.getElementById("definition");
const questionList = document.getElementById("question-list");
const questionIdInput = document.getElementById("question-id");
const cancelBtn = document.getElementById("cancel-edit");

// Load questions
async function fetchQuestions() {
  const res = await fetch(API_URL);
  const questions = await res.json();
  renderQuestions(questions);
}

// Render table rows
function renderQuestions(questions) {
  questionList.innerHTML = "";
  questions.forEach((q, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${q.word}</td>
      <td>${q.definition}</td>
      <td class="actions">
        <button onclick="editQuestion('${q._id}', '${q.word}', '${q.definition}')">Edit</button>
        <button onclick="deleteQuestion('${q._id}')">Delete</button>
      </td>
    `;
    questionList.appendChild(tr);
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();

  const word = wordInput.value.trim();
  const definition = definitionInput.value.trim();
  const id = questionIdInput.value;

  if (!word || !definition) return;

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_URL}/${id}` : API_URL;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, definition }),
  });

  form.reset();
  questionIdInput.value = "";
  cancelBtn.style.display = "none";
  fetchQuestions();
};

function editQuestion(id, word, definition) {
  wordInput.value = word;
  definitionInput.value = definition;
  questionIdInput.value = id;
  cancelBtn.style.display = "inline";
}

cancelBtn.onclick = () => {
  form.reset();
  questionIdInput.value = "";
  cancelBtn.style.display = "none";
};

async function deleteQuestion(id) {
  if (confirm("Delete this question?")) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchQuestions();
  }
}

fetchQuestions();

