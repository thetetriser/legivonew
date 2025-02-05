import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
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

// Function to fetch word data from Firestore (including synonyms)
async function fetchWordData(words) {
  const wordDataMap = new Map();

  for (const word of words) {
    const wordQuery = query(collection(db, "words"), where("name", "==", word));
    const querySnapshot = await getDocs(wordQuery);

    if (!querySnapshot.empty) {
      const wordData = querySnapshot.docs[0].data();
      const synonyms = wordData.synonyms ? wordData.synonyms : "";  // Don't split synonyms
      const questions = wordData.questions ? wordData.questions : [];
      wordDataMap.set(word, {synonyms, questions});  // Store the full synonym string
      
    } else {
      console.log(`No data found for the word: ${word}`);
    }
  }

  return wordDataMap;
}


// Utility function to shuffle an array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


// Function to handle page load and display words and scrambled synonyms
window.onload = async () => {
  const selectedWords = JSON.parse(localStorage.getItem("selectedWords"));

  

  if (!selectedWords || selectedWords.length === 0) {
    alert("No words selected for the test.");
    return;
  }

  // Fetch data from Firestore
  const wordDataMap = await fetchWordData(selectedWords);

  selectedWords.forEach(word => {
    const wordData = wordDataMap.get(word);
    if (wordData) {
      const questions = wordData.questions;
      if (Array.isArray(questions) && questions.length > 0) {
        const firstQuestion = questions[0].replace(word, `<input type="text" class="answer-box" data-word="${word}">`);
        const secondQuestion = questions[1].replace(word, `<input type="text" class="answer-box" data-word="${word}">`);

        const partA = document.getElementById("partA");
        const partB = document.getElementById("partB");

        partA.innerHTML = `<p>${firstQuestion}</p>`;
        partB.innerHTML = `<p>${secondQuestion}</p>`;
      }
    }
  });
  

  
  const wordListContainer = document.getElementById("word-list");
  const synonymListContainer = document.getElementById("synonym-list");
  const partA = document.getElementById("partA");
  const partB = document.getElementById("partB");

  // Display the words with blanks
  selectedWords.forEach(word => {
    const wordData = wordDataMap.get(word);
    if (wordData) {
      const listItem = document.createElement("li");
      listItem.classList.add("word");
      listItem.innerHTML = `
        <span>${word}</span>
        <span class="blank" data-word="${word}"></span>
      `;
      wordListContainer.appendChild(listItem);
    }
  });

  // Display the synonyms as a single draggable box
  selectedWords.forEach(word => {
    const wordData = wordDataMap.get(word);
    if (wordData) {
      const synonymBox = document.createElement("li");
      synonymBox.classList.add("synonym", "draggable");
      synonymBox.setAttribute("draggable", "true");
      synonymBox.textContent = wordData.synonyms;  // Display full synonym string
      synonymBox.addEventListener("dragstart", dragStart);
      synonymBox.addEventListener("dragend", dragEnd);
      synonymListContainer.appendChild(synonymBox);
      
    }
  });

// shuffle the synonyms
  const synonymList = synonymListContainer.querySelectorAll(".synonym");
  const shuffledSynonyms = shuffle(Array.from(synonymList));
  shuffledSynonyms.forEach(synonym => synonymListContainer.appendChild(synonym));

  // Handle drag and drop events
  function dragStart(e) {
    e.dataTransfer.setData("text", e.target.textContent.trim());
    e.target.style.backgroundColor = "orange"; // Reset background color
  }
  
  function dragEnd(e) {
    e.target.style.removeProperty("background-color");
  }

  wordListContainer.querySelectorAll(".blank").forEach(blank => {
    blank.addEventListener("dragover", dragOver);
    blank.addEventListener("dragenter", dragEnter);
    blank.addEventListener("dragleave", dragLeave);
    blank.addEventListener("drop", drop);
  });

  // Prevent the default behavior for dragover
  function dragOver(e) {
    e.preventDefault();
  }

  function dragEnter(e) {
    e.target.classList.add("drag-over");
  }

  function dragLeave(e) {
    e.target.classList.remove("drag-over");
  }

  function drop(e) {
    e.preventDefault();
    const droppedSynonym = e.dataTransfer.getData("text");
    const word = e.target.getAttribute("data-word");
  
    // Place the synonym in the blank
    e.target.textContent = droppedSynonym;  // Display the synonym in the blank
    e.target.classList.remove("drag-over");
  
    // Remove the dragged synonym from the right side
    const synonymBox = Array.from(synonymListContainer.querySelectorAll("li"))
      .find(item => item.textContent.trim() === droppedSynonym);
    if (synonymBox) {
      synonymBox.remove();
    }
  }

  // Check answers button
  const checkButton = document.createElement("button");
  checkButton.textContent = "Check Answers";
  checkButton.addEventListener("click", checkAnswers);
  document.body.appendChild(checkButton);

  function checkAnswers() {
    let correctCount = 0;
    let incorrectCount = 0;
  
    wordListContainer.querySelectorAll(".blank").forEach(blank => {
      const word = blank.getAttribute("data-word");
      const correctSynonyms = wordDataMap.get(word);
      const synonymEntered = blank.textContent.trim();
  
      // Check if the synonym matches the word (exact match with full synonym string)
      if (correctSynonyms && synonymEntered === correctSynonyms.synonyms) {
        correctCount++;
        blank.style.backgroundColor = "#d3ffd3";  // Green for correct match
        blank.setAttribute("data-correct", "true"); // Mark as correct, to avoid moving back

      
      
  
        // Delete the corresponding draggable box from the right side
        const synonymBox = Array.from(synonymListContainer.querySelectorAll("li"))
          .find(item => item.textContent.trim() === correctSynonyms);
        if (synonymBox) {
          synonymBox.remove();
        }
      } else {
        incorrectCount++;
        blank.style.backgroundColor = "#ffdddd";  // Red for incorrect match
        
        blank.textContent = "";
        blank.setAttribute("data-correct", "false"); // Mark as incorrect
        // Return the incorrect synonym to the right side
        if (synonymEntered) {
          returnToSynonymList(synonymEntered);
        }
      }
    });
  
    alert(`You got ${correctCount} out of ${selectedWords.length} correct!`);
    // Disable further dragging for correct answers
    disableDraggableForCorrect();
  }
  
  // Function to return incorrect synonym back to the right list
  function returnToSynonymList(synonym) {
    const synonymListItems = Array.from(synonymListContainer.querySelectorAll("li"));
    const existingItem = synonymListItems.find(item => item.textContent.trim() === synonym);

    if (!existingItem) {
      const newItem = document.createElement("li");
      newItem.classList.add("synonym", "draggable"); // Add draggable class
      newItem.setAttribute("draggable", "true");
      newItem.textContent = synonym;

      // Ensure orange background
      newItem.style.backgroundColor = "orange"; 

      // Add drag event listeners
      newItem.addEventListener("dragstart", dragStart);
      newItem.addEventListener("dragend", dragEnd);

      synonymListContainer.appendChild(newItem);
    }
  }

  // Disable draggable for correct answers (so they can't be dragged again)
  function disableDraggableForCorrect() {
    wordListContainer.querySelectorAll(".blank").forEach(blank => {
      if (blank.getAttribute("data-correct") === "true") {
        const synonym = blank.textContent.trim();
        const matchingSynonymBox = Array.from(synonymListContainer.querySelectorAll("li"))
          .find(item => item.textContent.trim() === synonym);
        
        if (matchingSynonymBox) {
          matchingSynonymBox.setAttribute("draggable", "false"); // Disable further dragging
        }
      }
    });
  }
};


