// static/js/script.js

// DOM Elements
const userInput    = document.getElementById("user-input");
const sendButton   = document.getElementById("send-button");
const chatHistory  = document.getElementById("chat-history");
const newChatButton= document.getElementById("new-chat");
// … (voice/image bits omitted for brevity) …

// State
let isAudioEnabled = true;
let isDarkMode     = true;
let currentImage   = null;

// Event Listeners
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
newChatButton.addEventListener("click", startNewChat);
// … (theme toggle, voice/image handlers) …

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat("user", message);
  userInput.value = "";
  scrollToBottom();

  const typingId = addTypingIndicator();

  fetch("/chatbot/api/generate/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
    .then(res => res.json())
    .then(({ reply }) => {
      document.getElementById(typingId)?.remove();
      addMessageToChat("assistant", reply);
      if (isAudioEnabled) speakResponse(reply);
      scrollToBottom();
    })
    .catch(err => {
      console.error(err);
      document.getElementById(typingId)?.remove();
      addMessageToChat("assistant", "Sorry, something went wrong.");
      scrollToBottom();
    });
}

function addMessageToChat(role, content) {
  const wrapper = document.createElement("div");
  wrapper.className = `mb-4 ${role === "user"? "text-right": ""}`;

  const bubble = document.createElement("div");
  bubble.className = role === "user"
    ? "inline-block bg-blue-50 p-3 rounded-lg dark:bg-gray-600"
    : "inline-block bg-green-50 p-3 rounded-lg dark:bg-gray-700";
  bubble.innerHTML = `<div class="whitespace-pre-wrap">${content}</div>`;

  wrapper.appendChild(bubble);
  chatHistory.appendChild(wrapper);
}

function addTypingIndicator() {
  const id = "typing-" + Date.now();
  const wrapper = document.createElement("div");
  wrapper.id = id;
  wrapper.className = "mb-4";

  const bubble = document.createElement("div");
  bubble.className = "inline-block bg-green-50 p-3 rounded-lg dark:bg-gray-700 typing-indicator";
  bubble.innerHTML = `<span></span><span></span><span></span>`;

  wrapper.appendChild(bubble);
  chatHistory.appendChild(wrapper);
  scrollToBottom();
  return id;
}

function speakResponse(text) {
  if (!window.speechSynthesis) return;
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  const clean = text.replace(/\*{1,2}(.*?)\*{1,2}/g,"$1");
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}

function startNewChat() {
  if (confirm("Start a new conversation?")) {
    chatHistory.innerHTML = "";
    userInput.value = "";
  }
}

function scrollToBottom() {
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// … plus your dark-mode toggle, voice/input handlers (unchanged) …


function toggleVoiceInput() {
  if (recognition.recording) {
    recognition.stop();
    voiceInput.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                `;
  } else {
    recognition.start();
    voiceInput.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                `;
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentImage = {
      type: file.type,
      data: e.target.result.split(",")[1],
      url: e.target.result,
    };

    previewImage.src = currentImage.url;
    imagePreview.classList.remove("hidden");
    checkInput();
  };
  reader.readAsDataURL(file);
}

function removeUploadedImage() {
  currentImage = null;
  imageInput.value = "";
  imagePreview.classList.add("hidden");
  checkInput();
}

function toggleAudioOutput() {
  isAudioEnabled = !isAudioEnabled;
  audioStatus.textContent = isAudioEnabled ? "Audio On" : "Audio Off";

  if (!isAudioEnabled && synth.speaking) {
    synth.cancel();
  }
}

function enableDarkMode() {
  isDarkMode = true;
  body.classList.add("dark");
  lightIcon.classList.add("hidden");
  darkIcon.classList.remove("hidden");
  localStorage.setItem("darkMode", "true");
}

function disableDarkMode() {
  isDarkMode = false;
  body.classList.remove("dark");
  lightIcon.classList.remove("hidden");
  darkIcon.classList.add("hidden");
  localStorage.setItem("darkMode", "false");
}

function toggleDarkMode() {
  if (isDarkMode) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

function startNewChat() {
  if (confirm("Start a new chat? Your current conversation will be cleared.")) {
    chatHistory.innerHTML = `
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0">
                            <img src="https://cdn-icons-png.flaticon.com/512/10793/10793327.png" alt="AI Avatar" class="h-10 w-10 object-cover">
                        </div>
                        <div class="message-ai bg-green-50 p-4 rounded-lg max-w-3xl dark:bg-gray-700">
                            <h3 class="font-semibold text-[#4d9d7f] mb-2 dark:text-green-400">Sustainable Gardening Advisor</h3>
                            <div class="markdown-content text-gray-700 dark:text-gray-300">
                                <p>Hello! I'm your Sustainable Gardening Advisor. What would you like to learn about today?</p>
                            </div>
                        </div>
                    </div>
                `;
  }
}

function scrollToBottom() {
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Speech Recognition Events
recognition.onresult = (event) => {
  const speechResult = event.results[0][0].transcript;
  userInput.value = speechResult;
  checkInput();
  autoResizeTextarea();
  voiceInput.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            `;
};

recognition.onerror = (event) => {
  console.error("Speech recognition error:", event.error);
  voiceInput.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            `;
};

recognition.onend = () => {
  if (recognition.recording !== true) {
    voiceInput.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                `;
  }
};