const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


// =========================
// ELEMENTS
// =========================

const startBtn =
  document.getElementById("startBtn");

const stopBtn =
  document.getElementById("stopBtn");

const generateBtn =
  document.getElementById("generateBtn");

const clearBtn =
  document.getElementById("clearBtn");

const pasteGenerateBtn =
  document.getElementById("pasteGenerateBtn");

const transcriptBox =
  document.getElementById("transcript");

const notesBox =
  document.getElementById("notes");

const pasteInput =
  document.getElementById("pasteInput");

const status =
  document.getElementById("status");

const mic =
  document.getElementById("mic");


// =========================
// SETTINGS
// =========================

const AI_URL =
  "https://gemini-back-in.onrender.com/generate";


let recognition = null;

let listening = false;

let transcript = "";


// =========================
// SPEECH RECOGNITION
// =========================

if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();

  recognition.continuous =
    true;

  recognition.interimResults =
    true;

  recognition.lang =
    "en-US";


  recognition.onresult =
    function (event) {

      let temporary = "";


      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const words =
          event.results[i][0].transcript;


        if (
          event.results[i].isFinal
        ) {

          transcript +=
            words.trim() + ". ";

        }

        else {

          temporary +=
            words;

        }

      }


      transcriptBox
        .classList
        .remove("empty");


      transcriptBox.textContent =
        transcript + temporary;

    };


  recognition.onend =
    function () {

      if (listening) {

        try {

          recognition.start();

        }

        catch (error) {

          console.log(error);

        }

      }

    };


  recognition.onerror =
    function (event) {

      console.log(
        "Speech recognition error:",
        event.error
      );

      if (
        event.error !== "no-speech"
      ) {

        status.textContent =
          "Microphone error. Try again.";

      }

    };

}

else {

  status.textContent =
    "Speech recognition isn't supported in this browser.";

}


// =========================
// START LISTENING
// =========================

startBtn.onclick =
  function () {

    if (!recognition) {

      status.textContent =
        "Speech recognition isn't supported.";

      return;

    }


    if (listening) {

      return;

    }


    listening = true;


    try {

      recognition.start();

    }

    catch (error) {

      console.log(error);

    }


    status.textContent =
      "Listening...";


    mic.classList.add(
      "active"
    );

  };


// =========================
// STOP LISTENING
// =========================

stopBtn.onclick =
  function () {

    listening = false;


    if (recognition) {

      try {

        recognition.stop();

      }

      catch (error) {

        console.log(error);

      }

    }


    status.textContent =
      "Recording stopped";


    mic.classList.remove(
      "active"
    );

  };


// =========================
// CLEAR
// =========================

clearBtn.onclick =
  function () {

    listening = false;


    if (recognition) {

      try {

        recognition.stop();

      }

      catch (error) {

        console.log(error);

      }

    }


    transcript =
      "";


    transcriptBox.textContent =
      "Your teacher's words will appear here.";


    transcriptBox
      .classList
      .add("empty");


    pasteInput.value =
      "";


    notesBox.textContent =
      "Listen or paste some text, then generate your notes.";


    notesBox
      .classList
      .add("empty");


    status.textContent =
      "Ready to listen";


    mic.classList.remove(
      "active"
    );

  };


// =========================
// AI FUNCTION
// =========================

async function generateNotes(text) {

  const cleanText =
    text.trim();


  if (!cleanText) {

    notesBox.textContent =
      "Add some text first.";

    return;

  }


  generateBtn.disabled =
    true;

  pasteGenerateBtn.disabled =
    true;


  generateBtn.textContent =
    "Generating...";

  pasteGenerateBtn.textContent =
    "Generating...";


  notesBox
    .classList
    .remove("empty");


  notesBox.textContent =
    "Creating your notes...";


  try {

    const response =
      await fetch(
        AI_URL,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              prompt:
                cleanText

            })

        }
      );


    if (!response.ok) {

      let serverMessage =
        "";

      try {

        const errorData =
          await response.json();

        serverMessage =
          errorData.error || "";

      }

      catch (error) {}


      throw new Error(
        serverMessage ||
        `Server error ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !data.text ||
      !data.text.trim()
    ) {

      throw new Error(
        "The AI returned an empty response."
      );

    }


    notesBox.textContent =
      data.text;

  }

  catch (error) {

    console.error(
      "LiveNote AI error:",
      error
    );


    notesBox.textContent =
      "LiveNote AI couldn't generate your notes. Please try again.";

  }

  finally {

    generateBtn.disabled =
      false;

    pasteGenerateBtn.disabled =
      false;


    generateBtn.textContent =
      "✦ Generate Notes";

    pasteGenerateBtn.textContent =
      "✦ Generate Notes From Text";

  }

}


// =========================
// GENERATE FROM MICROPHONE
// =========================

generateBtn.onclick =
  function () {

    const lectureText =
      transcript.trim();


    if (!lectureText) {

      notesBox.textContent =
        "Record something first.";

      return;

    }


    generateNotes(
      lectureText
    );

  };


// =========================
// GENERATE FROM PASTED TEXT
// =========================

pasteGenerateBtn.onclick =
  function () {

    const pastedText =
      pasteInput.value.trim();


    if (!pastedText) {

      notesBox.textContent =
        "Paste some text first.";

      return;

    }


    generateNotes(
      pastedText
    );

  };

