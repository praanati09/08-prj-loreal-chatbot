const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");
const sendBtn = document.getElementById("sendBtn");

/* Use your real Cloudflare Worker URL here */
const WORKER_URL = "https://loreal-chatbot.ppurohi5.workers.dev";

const conversationHistory = [
  {
    role: "system",
    content: `
You are L'Oréal's Smart Routine & Product Advisor.

Your job is to help users with:
- L'Oréal skincare
- L'Oréal makeup
- L'Oréal haircare
- L'Oréal fragrance
- Beauty routines
- Product recommendations
- Product education

Rules:
- Only answer questions related to L'Oréal, beauty, skincare, makeup, haircare, fragrance, self-care, and routines.
- Politely refuse unrelated questions and redirect the user back to L'Oréal beauty topics.
- Be helpful, elegant, warm, and concise.
- Ask follow-up questions when useful, such as skin type, skin concern, hair type, routine goals, or preferences.
- When recommending products, keep recommendations focused on L'Oréal products or L'Oréal-owned beauty brands.
- Do not provide medical diagnosis. If the user describes a serious skin issue or reaction, suggest consulting a dermatologist.
`
  }
];

function addMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role === "user" ? "user" : "ai"}`;

  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${
    role === "user" ? "user-bubble" : "ai-bubble"
  }`;
  bubble.textContent = text;

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addTypingMessage() {
  const row = document.createElement("div");
  row.className = "message-row ai";
  row.id = "typingRow";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble ai-bubble typing-bubble";
  bubble.textContent = "Thinking...";

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingMessage() {
  const typingRow = document.getElementById("typingRow");
  if (typingRow) {
    typingRow.remove();
  }
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  latestQuestion.textContent = message;
  addMessage("user", message);

  conversationHistory.push({
    role: "user",
    content: message
  });

  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;

  addTypingMessage();

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversationHistory
      })
    });

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response data:", data);

    removeTypingMessage();

    if (!response.ok) {
      addMessage("assistant", `Error: ${data.error || "Unknown error"}`);
      console.error("Worker returned error:", response.status, data);
      return;
    }

    const assistantReply =
      data.reply || "Sorry, I couldn't generate a response right now.";

    addMessage("assistant", assistantReply);

    conversationHistory.push({
      role: "assistant",
      content: assistantReply
    });
  } catch (error) {
    removeTypingMessage();
    addMessage(
      "assistant",
      `Connection error: ${error.message}`
    );
    console.error("Chatbot fetch failed:", error);
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
});