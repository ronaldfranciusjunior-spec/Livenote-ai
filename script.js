const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const transcriptBox = document.getElementById("transcript");
const notesBox = document.getElementById("notes");
const status = document.getElementById("status");
const mic = document.getElementById("mic");

let recognition = null;
let listening = false;
let transcript = "";

/* =========================
   SPEECH RECOGNITION
   ========================= */
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    let temporary = "";
    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      const words =
        event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        transcript += words.trim() + ". ";
      } else {
        temporary += words;
      }
    }
    transcriptBox.classList.remove("empty");
    transcriptBox.textContent =
      transcript + temporary;
  };

  recognition.onend = function () {
    if (listening) {
      try {
        recognition.start();
      } catch (error) {}
    }
  };
}

/* =========================
   START LISTENING
   ========================= */
startBtn.onclick = function () {
  if (!recognition) {
    status.textContent =
      "Speech recognition isn't supported in this browser.";
    return;
  }
  if (listening) {
    return;
  }
  listening = true;
  try {
    recognition.start();
  } catch (error) {}
  status.textContent = "Listening...";
  mic.classList.add("active");
};

/* =========================
   STOP LISTENING
   ========================= */
stopBtn.onclick = function () {
  listening = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {}
  }
  status.textContent = "Recording stopped";
  mic.classList.remove("active");
};

/* =========================
   CLEAR
   ========================= */
clearBtn.onclick = function () {
  listening = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {}
  }
  transcript = "";
  transcriptBox.textContent =
    "Your teacher's words will appear here.";
  transcriptBox.classList.add("empty");
  notesBox.textContent =
    "Finish listening, then tap Generate Notes.";
  notesBox.classList.add("empty");
  status.textContent =
    "Ready to listen";
  mic.classList.remove("active");
};

/* =========================
   GENERATE AI NOTES
   ========================= */
generateBtn.onclick = async function () {
  const lectureText =
    transcriptBox.textContent.trim();

  if (
    !lectureText ||
    lectureText ===
      "Your teacher's words will appear here."
  ) {
    notesBox.textContent =
      "Record something first.";
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent =
    "Generating...";
  notesBox.classList.remove("empty");
  notesBox.textContent =
    "Creating your notes...";

  try {
    // NOTE: Render free-tier services sleep after inactivity and can take
    // 30-50s to wake up. AbortSignal.timeout gives it room to wake up
    // instead of failing immediately, while still failing eventually
    // if the server is genuinely unreachable.
    const response = await fetch(
      "https://gemini-back-in.onrender.com/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: lectureText
        }),
        signal: AbortSignal.timeout(60000)
      }
    );

    if (!response.ok) {
      // Surface the actual HTTP status instead of a generic message.
      throw new Error(
        `Server returned ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    notesBox.textContent =
      data.text ||
      "No notes were generated.";
  }
  catch (error) {
    console.error(error);

    // Show the real error on-screen instead of a generic message,
    // so you don't have to open DevTools every time to diagnose it.
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      notesBox.textContent =
        "LiveNote AI took too long to respond (the server may be waking up). Please try again in a moment.";
    } else if (error instanceof TypeError) {
      notesBox.textContent =
        "LiveNote AI couldn't connect (network or CORS issue). Check the console for details.";
    } else {
      notesBox.textContent =
        `LiveNote AI error: ${error.message}`;
    }
  }
  finally {
    generateBtn.disabled = false;
    generateBtn.textContent =
      "✦ Generate Notes";
  }
};
