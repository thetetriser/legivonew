import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxWpU8TWBDdiDP7zZxKW2ovS1OBYddixA",
  authDomain: "legivo-1.firebaseapp.com",
  projectId: "legivo-1",
  storageBucket: "legivo-1.appspot.com",
  messagingSenderId: "733952528595",
  appId: "1:733952528595:web:99bd0efdd4874d3ea50426"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let highlightedWords = new Set(); // Track highlighted words
let listedWords = new Set(); // Track words added to the list

// Function to load text and process word interactions
async function loadText() {
  const urlParams = new URLSearchParams(window.location.search);
  const no = urlParams.get("no");

  if (!no) {
    console.error("No text ID provided in the URL.");
    document.getElementById("text-content").innerText = "No text ID provided.";
    return;
  }

  try {
    const collectionRef = collection(db, "texts");
    const q = query(collectionRef, where("no", "==", parseInt(no)));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const textDoc = querySnapshot.docs[0].data();

      // Render the text
      document.title = textDoc.title;
      document.getElementById("text-title").innerText = textDoc.title;
      document.getElementById("text-content").innerHTML = textDoc.content;

      // Fetch words from the words collection
      const wordCollectionRef = collection(db, "words");
      const wordQuerySnapshot = await getDocs(wordCollectionRef);

      // Map to store word data
      const wordDataMap = new Map();

      // Loop through word documents and add them to the wordDataMap
      wordQuerySnapshot.forEach((doc) => {
        const wordData = doc.data();
        const wordName = wordData.name;
        const wordDefinition = wordData.definition;
        const wordQuestions = wordData.questions || [];

        // Create a map entry for the word
        wordDataMap.set(wordName, {
          definition: wordDefinition,
          questions: wordQuestions,
        });
      });

      // Check if the wordDataMap is populated
      if (wordDataMap.size === 0) {
        console.warn("No words found in the 'words' collection.");
      }

      
       setupWordInteractions(wordDataMap) 
        
      

      // Render the questions
      const mcContainer = document.getElementById("mc-questions");
      const tfContainer = document.getElementById("tf-questions");

      if (textDoc.questions && textDoc.questions.multipleChoice) {
        textDoc.questions.multipleChoice.forEach((question, index) => {
          const optionsHtml = question.options
            .map(
              (option, i) => `
            <label>
              <input type="radio" name="mc-${index}" value="${i}" />
              ${option.text}
            </label>
          `
            )
            .join("");
          mcContainer.innerHTML += `
            <div class="question">
              <h4>${index + 1}. ${question.question}</h4>
              <div>${optionsHtml}</div>
            </div>
          `;
        });
      } else {
        mcContainer.innerHTML = "<p>No multiple-choice questions available.</p>";
      }

      if (textDoc.questions && textDoc.questions.trueFalse) {
        textDoc.questions.trueFalse.forEach((question, index) => {
          tfContainer.innerHTML += `
            <div class="question">
              <h4>${index + 1}. ${question.statement}</h4>
              <label>
                <input type="radio" name="tf-${index}" value="true" />
                True
              </label>
              <label>
                <input type="radio" name="tf-${index}" value="false" />
                False
              </label>
            </div>
          `;
        });
      } else {
        tfContainer.innerHTML = "<p>No true/false questions available.</p>";
      }

      // Attach event listener to "Check Answers" button
      document
        .getElementById("check-answers-button")
        .addEventListener("click", () => checkAnswers(textDoc.questions));
    } else {
      console.error("No document found with the specified ID.");
      document.getElementById("text-content").innerText = "Text not found.";
    }
  } catch (error) {
    console.error("Error fetching text:", error);
    document.getElementById("text-content").innerText =
      "An error occurred while loading the text.";
  }
}



// Function to set up word interactions for the loaded text
function setupWordInteractions(wordDataMap) {
  const textContent = document.getElementById("text-content");

  // Split text into words and wrap matched ones with clickable spans
  const textWords = textContent.innerHTML.split(/\b/); // Split by word boundaries
  
  const processedWords = textWords.map((word) => {
    const sanitizedWord = word.trim().toLowerCase();
    if (wordDataMap.has(sanitizedWord)) {
      return `<span class="clickable-word">${word}</span>`;
    }
    return word; // Return unchanged if not a match
  });
  textContent.innerHTML = processedWords.join("");

  // Get all the word elements
  const clickableWords = textContent.querySelectorAll(".clickable-word");

  clickableWords.forEach((wordElement) => {
    const word = wordElement.innerText.toLowerCase();

    // Highlight on hover
    textContent.addEventListener("mouseenter", () => {
      wordElement.classList.add("highlighted");
      if(listedWords.has(word)){
        wordElement.classList.remove("highlighted");
      }
    });

    textContent.addEventListener("mouseleave", () => {
      wordElement.classList.remove("highlighted");
    });

    // On click, add to list
    wordElement.addEventListener("click", () => {
      if (listedWords.has(word)) {
        alert(`The word "${word}" is already in the list.`);
        return;
      }
      
      // Add word to the list
      const wordData = wordDataMap.get(word);
      const listItem = document.createElement("li");
      listItem.innerHTML = `<strong>${word}</strong>: ${
        wordData?.definition || "No definition available"
      }`;
      listItem.addEventListener("click", () => {
        // Remove word from the list
        listItem.remove();
        listedWords.delete(word);
      });
      document.getElementById("words-in-text").appendChild(listItem);
      listedWords.add(word);
      highlightedWords.remove(word);
      console.log(listedWords);
    });
  });
}
document.getElementById("start-vocab-test-button").addEventListener("click", () => {
  const listedWordsArray = Array.from(listedWords); // Convert Set to Array
  localStorage.setItem("selectedWords", JSON.stringify(listedWordsArray)); // Store in localStorage
  window.location.href = "/voctest/voctest.html";
});


// Function to check the answers
function checkAnswers(questions) {
  let score = 0;
  let total = 0;

  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = ""; // Clear previous results

  // Check Multiple-Choice Questions
  if (questions.multipleChoice) {
    questions.multipleChoice.forEach((question, index) => {
      const selectedOption = document.querySelector(
        `input[name="mc-${index}"]:checked`
      );

      if (selectedOption) {
        const isCorrect =
          question.options[parseInt(selectedOption.value)].isCorrect;
        if (isCorrect) {
          score++;
          resultsContainer.innerHTML += `<p>MCQ ${index + 1}: Correct</p>`;
        } else {
          resultsContainer.innerHTML += `<p>MCQ ${index + 1}: Incorrect</p>`;
        }
      } else {
        resultsContainer.innerHTML += `<p>MCQ ${index + 1}: Not Answered</p>`;
      }
      total++;
    });
  }

  // Check True/False Questions
  if (questions.trueFalse) {
    questions.trueFalse.forEach((question, index) => {
      const selectedOption = document.querySelector(
        `input[name="tf-${index}"]:checked`
      );

      if (selectedOption) {
        const userAnswer = selectedOption.value === "true";
        if (userAnswer === question.isTrue) {
          score++;
          resultsContainer.innerHTML += `<p>True/False ${index + 1}: Correct</p>`;
        } else {
          resultsContainer.innerHTML += `<p>True/False ${index + 1}: Incorrect</p>`;
        }
      } else {
        resultsContainer.innerHTML += `<p>True/False ${index + 1}: Not Answered</p>`;
      }
      total++;
    });
  }

  // Display final score
  resultsContainer.innerHTML += `<h3>Your Score: ${score} / ${total}</h3>`;
}

window.onload = loadText;

