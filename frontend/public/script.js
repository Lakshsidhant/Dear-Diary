// DOM elements
const analyzeBtn = document.getElementById('analyze-btn');
const sendBtn = document.getElementById('send-btn');
const dateInput = document.getElementById('date');
const diaryEntryInput = document.getElementById('diary-entry');
const chatSection = document.getElementById('chat-section');
const chatBox = document.getElementById('chat-box');
const userInputElement = document.getElementById('user-input');

// Append messages to chat
function appendMessage(message, className) {
  const msgDiv = document.createElement('div');
  msgDiv.textContent = message;
  msgDiv.classList.add('message', className);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Call /insights_and_emojis endpoint
async function analyzeDiary() {
  const date = dateInput.value.trim();
  const diaryEntry = diaryEntryInput.value.trim();

  if (!date || !diaryEntry) {
    alert("Please enter both date and diary entry.");
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/insights_and_emojis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, user_input: diaryEntry })
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.detail || "Error analyzing diary.");
      return;
    }

    const data = await response.json();
    console.log("Insights and Emojis:", data);

    // Switch to chat section
    chatSection.classList.remove('hidden');
    document.getElementById('setup-section').classList.add('hidden');

    // Start chat with first response
    const initialResponse = await getAIResponse("Start the conversation based on the insights");
    appendMessage(initialResponse.response, 'bot-message');

  } catch (error) {
    alert("Failed to analyze diary: " + error.message);
  }
}

// Call /response endpoint
async function getAIResponse(userInput) {
  const response = await fetch('http://localhost:8000/response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_input: userInput })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch AI response");
  }

  return await response.json();
}

// Send button click
sendBtn.addEventListener('click', async () => {
  const userInput = userInputElement.value.trim();
  if (!userInput) return;

  appendMessage(userInput, 'user-message');
  userInputElement.value = '';

  try {
    const botResponse = await getAIResponse(userInput);
    appendMessage(botResponse.response, 'bot-message');
  } catch (error) {
    alert(error.message);
  }
});

// Enter key sends message
userInputElement.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

// Diary analyze button
analyzeBtn.addEventListener('click', analyzeDiary);
