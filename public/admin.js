const API_URL = "/api/questions";
//const CATEGORY_API = "/api/categories/all";
const CATEGORY_API = "/api/categories";


// Form elements
const form = document.getElementById("question-form");
const wordInput = document.getElementById("word");
const definitionInput = document.getElementById("definition");
const categorySelect = document.getElementById("category"); // new
const questionIdInput = document.getElementById("question-id");
const cancelBtn = document.getElementById("cancel-edit");
const questionList = document.getElementById("question-list");

// Load and render all questions from DB
async function fetchQuestions() {
  const res = await fetch(API_URL);
  const questions = await res.json();
  renderQuestions(questions);
}

// Load and populate category dropdown from DB
async function loadCategories() {
  try {
    const res = await fetch(CATEGORY_API);
    const categories = await res.json();

    // Clear existing options
    categorySelect.innerHTML = `<option value="">Select a category</option>`;

    // Populate dropdown
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat._id;
      option.textContent = cat.category_name;
      categorySelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

// Render questions in the table
function renderQuestions(questions) {
  questionList.innerHTML = "";
  questions.forEach((q, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${q.word}</td>
      <td>${q.definition}</td>
      <td>${q.category?.category_name.toUpperCase() || "Uncategorized"}</td>
      <td class="actions">
        <button onclick="editQuestion('${q._id}', '${q.word}', '${q.definition}', '${q.category?._id || ''}')">Edit</button>
        <button onclick="deleteQuestion('${q._id}')">Delete</button>
      </td>
    `;
    questionList.appendChild(tr);
  });
}

// Submit form for add/update question
form.onsubmit = async (e) => {
  e.preventDefault();

  const word = wordInput.value.trim();
  const definition = definitionInput.value.trim();
  const category = categorySelect.value.trim(); // ✅ Get selected category
  const id = questionIdInput.value;

  if (!word || !definition || !category) return;

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_URL}/${id}` : API_URL;

  console.log({ word, definition, category });

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, definition, category }),
  });

  // Reset form after submission
  form.reset();
  questionIdInput.value = "";
  cancelBtn.style.display = "none";
  fetchQuestions();
};

// Pre-fill form for editing a question
function editQuestion(id, word, definition, categoryId) {
  wordInput.value = word;
  definitionInput.value = definition;
  categorySelect.value = categoryId || "";
  questionIdInput.value = id;
  cancelBtn.style.display = "inline";
}

// Cancel editing/reset form
cancelBtn.onclick = () => {
  form.reset();
  questionIdInput.value = "";
  cancelBtn.style.display = "none";
};

// Delete a question
async function deleteQuestion(id) {
  if (confirm("Delete this question?")) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchQuestions();
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchQuestions();
  loadCategories();
});


// --- CATEGORY MANAGEMENT ---

const categoryForm = document.getElementById("category-form");
const categoryNameInput = document.getElementById("category-name");
const categoryDefaultCheckbox = document.getElementById("category-default");
const categoryIdInput = document.getElementById("category-id");
const cancelCategoryBtn = document.getElementById("cancel-category-edit");
const categoryList = document.getElementById("category-list");

// Fetch and display categories in the category management table
async function fetchAndRenderCategories() {
  try {
    const res = await fetch(CATEGORY_API);
    const categories = await res.json();

    // Populate dropdown
    categorySelect.innerHTML = `<option value="">Select a category</option>`;
    categories.forEach((cat, index) => {
      // Populate dropdown
      const option = document.createElement("option");
      option.value = cat._id;
      option.textContent = cat.category_name;
      categorySelect.appendChild(option);

      // Render in table
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${cat.category_name}</td>
        <td>${cat.isDefault ? "✅" : ""}</td>
        <td>
          <button onclick="editCategory('${cat._id}', '${cat.category_name}', ${cat.isDefault})">Edit</button>
          <button onclick="deleteCategory('${cat._id}')">Delete</button>
        </td>
      `;
      categoryList.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

// Handle category form submission (add/edit)
categoryForm.onsubmit = async (e) => {
  e.preventDefault();
  const name = categoryNameInput.value.trim();
  const isDefault = categoryDefaultCheckbox.checked;
  const id = categoryIdInput.value;

  if (!name) return;

  const method = id ? "PUT" : "POST";
  const url = id ? `${CATEGORY_API}/${id}` : CATEGORY_API;

  try {
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_name: name, isDefault }),
    });

    resetCategoryForm();
    await refreshCategories();
  } catch (err) {
    console.error("Failed to save category", err);
  }
};

// Pre-fill category form for editing
function editCategory(id, name, isDefault) {
  categoryIdInput.value = id;
  categoryNameInput.value = name;
  categoryDefaultCheckbox.checked = isDefault;
  cancelCategoryBtn.style.display = "inline";
}

// Cancel editing/reset form
cancelCategoryBtn.onclick = () => resetCategoryForm();

function resetCategoryForm() {
  categoryForm.reset();
  categoryIdInput.value = "";
  cancelCategoryBtn.style.display = "none";
}

// Delete a category
async function deleteCategory(id) {
  if (confirm("Delete this category?")) {
    try {
      await fetch(`${CATEGORY_API}/${id}`, { method: "DELETE" });
      await refreshCategories();
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  }
}

// Refresh category list and dropdown
async function refreshCategories() {
  categoryList.innerHTML = "";
  await fetchAndRenderCategories();
}

// INIT (override existing DOMContentLoaded)
document.addEventListener("DOMContentLoaded", async () => {
  await fetchQuestions();
  await refreshCategories(); // replaces loadCategories
});
