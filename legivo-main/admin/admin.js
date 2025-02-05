// Import Firebase app and Firestore functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, FieldValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxWpU8TWBDdiDP7zZxKW2ovS1OBYddixA",
  authDomain: "legivo-1.firebaseapp.com",
  projectId: "legivo-1",
  storageBucket: "legivo-1.appspot.com",
  messagingSenderId: "733952528595",
  appId: "1:733952528595:web:99bd0efdd4874d3ea50426",
  measurementId: "G-X5NH69G6DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add Text Function
const textForm = document.getElementById("text-form");
textForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const textId = document.getElementById("text-id").value.trim();
  const textContent = document.getElementById("text-content").value.trim();
  const textNo = document.getElementById("text-no").value.trim();
  

  if (textId === "") {
    alert("Please enter a text ID.");
    return;
  }

  if (textContent === "") {
    alert("Please enter text content.");
    return;
  }

  if (textNo === "") {
    alert("Please enter a text number.");
    return;
  }

  try {
    await setDoc(doc(db, "texts", textId), {
      no: parseInt(textNo), // Convert textNo to a number using parseInt() function.textNo,
      title: textId,
      content: textContent,
      questions: []

    });
    alert("Text added successfully!");
    textForm.reset();
  } catch (error) {
    console.error("Error adding text:", error);
    alert("Failed to add the text. Please try again later.");
  }
});

// Add Question Function
// Add Multiple-Choice Question
const mcForm = document.getElementById("mc-question-form");
mcForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const textId = document.getElementById("text-id-mc").value.trim();
  const questionText = document.getElementById("mc-question-text").value.trim();

  if (textId === "" || questionText === "") {
    alert("Text ID and question are required.");
    return;
  }

  const options = Array.from(document.querySelectorAll(".mc-option")).map((input) => ({
    text: input.value.trim(),
    isCorrect: false,
  }));

  const correctOptionIndex = parseInt(document.getElementById("mc-correct-option").value);
  options[correctOptionIndex].isCorrect = true;

  try {
    await updateDoc(doc(db, "texts", textId), {
      "questions.multipleChoice": arrayUnion({
        question: questionText,
        options: options,
      }),
    });
    alert("Multiple-choice question added successfully!");
    mcForm.reset();
  } catch (error) {
    console.error("Error adding multiple-choice question:", error);
    alert("Failed to add the question. Try again later.");
  }
});

// Add True/False Question
const tfForm = document.getElementById("tf-question-form");
tfForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const textId = document.getElementById("text-id-tf").value.trim();
  const statementText = document.getElementById("tf-statement-text").value.trim();
  const isTrue = document.getElementById("tf-is-true").value === "true";

  if (textId === "" || statementText === "") {
    alert("Text ID and statement are required.");
    return;
  }

  try {
    await updateDoc(doc(db, "texts", textId), {
      "questions.trueFalse": arrayUnion({
        statement: statementText,
        isTrue: isTrue,
      }),
    });
    alert("True/False question added successfully!");
    tfForm.reset();
  } catch (error) {
    console.error("Error adding true/false question:", error);
    alert("Failed to add the statement. Try again later.");
  }
});
