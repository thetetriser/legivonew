import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxWpU8TWBDdiDP7zZxKW2ovS1OBYddixA",
  authDomain: "legivo-1.firebaseapp.com",
  projectId: "legivo-1",
  storageBucket: "legivo-1.firebasestorage.app",
  messagingSenderId: "733952528595",
  appId: "1:733952528595:web:99bd0efdd4874d3ea50426",
  measurementId: "G-X5NH69G6DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Listen for form submission
document.getElementById('add-word-form').addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent form from reloading the page

  const wordsInput = document.getElementById('words-input').value.trim();

  if (!wordsInput) {
    alert('Please enter words and their details.');
    return;
  }

  // Split input by '>>' and process each word entry
  const words = wordsInput.split('>>').map((entry) => entry.trim()).filter(Boolean);

  for (const wordEntry of words) {
    // Split the word entry into parts by ':'
    const parts = wordEntry.split(':').map((field) => field.trim());

    if (parts.length < 7) {
      console.error('Incorrect word format:', wordEntry);
      continue;
    }

    const [word, baseForm, definition, tos, synonyms, exampleSentence, questionsSection] = parts;

    // Split the questions section by '&' to separate the two fill-in-the-blank questions
    const questions = questionsSection.split('&').map((q) => q.trim()).filter(Boolean);

    if (questions.length !== 2) {
      console.error('Incorrect number of questions for word:', word);
      continue;
    }

    try {
      // Add the word entry to Firestore with structured data
      await addDoc(collection(db, 'words'), {
        name: word,
        baseForm: baseForm,
        definition: definition,
        tos: tos,
        synonyms: synonyms,
        exampleSentence: exampleSentence,
        questions: questions, // Ensure two questions
      });
    } catch (error) {
      console.error('Error adding word:', error);
    }
  }

  alert('Words added successfully!');
  document.getElementById('words-input').value = ''; // Clear textarea after submission
});


//Sentence completion part beginning

