let video;
let model;

let label = "Nothing";

// ==========================
// DETECTION SETTINGS
// ==========================

let lastDetectionTime = 0;
const detectionInterval = 5000;

// Prevents Hello from triggering repeatedly
let helloProcessed = false;

// ==========================
// SPEECH SETTINGS
// ==========================

let voiceEnabled = false;
let voices = [];

// ==========================
// MODEL
// ==========================

const modelURL =
  "https://teachablemachine.withgoogle.com/models/jaOMYzL7l/";

// ==========================
// COMMUNICATION BOARD
// ==========================

const words = [
  "Hello",
  "Bye",
  "Please",
  "Thank You",
  "Drink",
  "Eat",
  "Help",
  "Yes",
  "No",
  "I love you",
  "Emergency",
  "Bathroom",
  "Turn on TV",
  "Itch",
  "Maybe"
];

let selectedIndex = 0;
let buttons = [];
let board;

// ==========================
// SETUP
// ==========================

async function setup() {

  createCanvas(400, 400);

  // ==========================
  // WEBCAM
  // ==========================

  video = createCapture(VIDEO, {
    flipped: true
  });

  video.size(300, 190);
  video.hide();

  // ==========================
  // VOICES
  // ==========================

  loadVoices();

  // ==========================
  // VOICE BUTTON
  // ==========================

  createVoiceButton();

  // ==========================
  // LOAD MODEL
  // ==========================

  model = await tmPose.load(
    modelURL + "model.json",
    modelURL + "metadata.json"
  );

  console.log("Pose model loaded!");

  // ==========================
  // COMMUNICATION BOARD
  // ==========================

  createCommunicationBoard();

  // ==========================
  // START CLASSIFICATION
  // ==========================

  classifyPose();
}

// ==========================
// DRAW
// ==========================

function draw() {

  // Webcam
  image(
    video,
    0,
    0,
    400,
    400
  );

  // Status bar
  fill(0);

  rect(
    0,
    0,
    width,
    45
  );

  // Status text
  fill(255);

  textSize(20);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    label,
    width / 2,
    22.5
  );
}

// ==========================
// VOICE BUTTON
// ==========================

function createVoiceButton() {

  let voiceButton =
    createButton(
      "🔊 Enable Voice"
    );

  voiceButton.position(
   CENTER,500
  );

  voiceButton.style(
    "font-size",
    "16px"
  );

  voiceButton.style(
    "padding",
    "8px"
  );

  voiceButton.style(
    "background",
    "white"
  );

  voiceButton.style(
    "border",
    "2px solid black"
  );

  voiceButton.style(
    "border-radius",
    "6px"
  );

  voiceButton.mousePressed(
    () => {

      voiceEnabled = true;

      speak(
        "Voice enabled"
      );

      voiceButton.html(
        "🔊 Voice Enabled"
      );

      console.log(
        "Voice enabled!"
      );
    }
  );
}

// ==========================
// LOAD VOICES
// ==========================

function loadVoices() {

  voices =
    window.speechSynthesis.getVoices();

  window.speechSynthesis.onvoiceschanged =
    () => {

      voices =
        window.speechSynthesis.getVoices();

      console.log(
        "Available voices:",
        voices.length
      );
    };
}

// ==========================
// COMMUNICATION BOARD
// ==========================

function createCommunicationBoard() {

  board = createDiv();

  board.position(
    CENTER,
    550
  );

  board.size(
    400,
    400
  );

  board.style(
    "display",
    "grid"
  );

  board.style(
    "grid-template-columns",
    "repeat(3, 1fr)"
  );

  board.style(
    "grid-template-rows",
    "repeat(5, 1fr)"
  );

  board.style(
    "gap",
    "8px"
  );

  board.style(
    "padding",
    "8px"
  );

  board.style(
    "box-sizing",
    "border-box"
  );

  // Create buttons
  for (
    let i = 0;
    i < words.length;
    i++
  ) {

    let button =
      createButton(
        words[i]
      );

    button.parent(
      board
    );

    button.style(
      "font-size",
      "20px"
    );

    button.style(
      "font-weight",
      "bold"
    );

    button.style(
      "border-radius",
      "8px"
    );

    button.style(
      "cursor",
      "pointer"
    );

    // Manual button press
    button.mousePressed(
      () => {

        speak(
          words[i]
        );

      }
    );

    buttons.push(
      button
    );
  }

  updateSelector();
}

// ==========================
// UPDATE GREEN SELECTOR
// ==========================

function updateSelector() {

  for (
    let i = 0;
    i < buttons.length;
    i++
  ) {

    if (
      i === selectedIndex
    ) {

      buttons[i].style(
        "background-color",
        "green"
      );

      buttons[i].style(
        "color",
        "white"
      );

      buttons[i].style(
        "border",
        "5px solid darkgreen"
      );

    } else {

      buttons[i].style(
        "background-color",
        "white"
      );

      buttons[i].style(
        "color",
        "black"
      );

      buttons[i].style(
        "border",
        "2px solid black"
      );
    }
  }
}

// ==========================
// MOVE SELECTOR
// ==========================

function moveSelector() {

  selectedIndex++;

  // Loop back to first word
  if (
    selectedIndex >=
    words.length
  ) {

    selectedIndex = 0;
  }

  updateSelector();

  console.log(
    "GREEN SELECTOR:",
    words[selectedIndex]
  );
}

// ==========================
// SPEECH
// ==========================

function speak(text) {

  if (!voiceEnabled) {

    console.log(
      "Voice is not enabled yet."
    );

    return;
  }

  // Stop previous speech
  window.speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(
      text
    );

  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;

  // Find English voice
  const englishVoice =
    voices.find(
      voice =>
        voice.lang.startsWith("en")
    );

  if (englishVoice) {

    speech.voice =
      englishVoice;
  }

  speech.onstart =
    () => {

      console.log(
        "Speaking:",
        text
      );
    };

  speech.onerror =
    (error) => {

      console.error(
        "Speech error:",
        error
      );
    };

  window.speechSynthesis.speak(
    speech
  );
}

// ==========================
// HANDLE CLASSIFICATION
// ==========================

function handleLabel(
  newLabel
) {

  const normalizedLabel =
    newLabel
      .trim()
      .toLowerCase();

  console.log(
    "Accepted detection:",
    normalizedLabel
  );

  // ==========================
  // NOTHING
  // ==========================

  if (
    normalizedLabel ===
    "nothing"
  ) {

    label = "Nothing";

    // IMPORTANT:
    // Every valid Nothing detection
    // moves the selector.
    //
    // Since detections happen every
    // 5 seconds, the selector moves
    // every 5 seconds while Nothing
    // remains detected.

    console.log(
      "NOTHING DETECTED → MOVE SELECTOR"
    );

    moveSelector();

    // Reset Hello so the next Hello
    // can trigger another input.
    helloProcessed = false;

    return;
  }

  // ==========================
  // HELLO
  // ==========================

  if (
    normalizedLabel ===
    "hello"
  ) {

    label = "Input";

    // Only speak once until
    // Nothing is detected again.

    if (
      !helloProcessed
    ) {

      console.log(
        "HELLO DETECTED → SPEAKING:",
        words[selectedIndex]
      );

      speak(
        words[selectedIndex]
      );

      helloProcessed = true;
    }

    return;
  }
}

// ==========================
// CLASSIFICATION
// ==========================

async function classifyPose() {

  try {

    // ==========================
    // ESTIMATE POSE
    // ==========================

    const {
      pose,
      posenetOutput
    } =
      await model.estimatePose(
        video.elt
      );

    // ==========================
    // PREDICT
    // ==========================

    const predictions =
      await model.predict(
        posenetOutput
      );

    // ==========================
    // FIND BEST PREDICTION
    // ==========================

    let bestPrediction =
      predictions[0];

    for (
      let i = 1;
      i < predictions.length;
      i++
    ) {

      if (
        predictions[i].probability >
        bestPrediction.probability
      ) {

        bestPrediction =
          predictions[i];
      }
    }

    // ==========================
    // 5-SECOND DETECTION TIMER
    // ==========================

    const currentTime =
      millis();

    if (
      currentTime -
        lastDetectionTime >=
      detectionInterval
    ) {

      lastDetectionTime =
        currentTime;

      console.log(
        "Prediction:",
        bestPrediction.className,
        bestPrediction.probability
      );

      handleLabel(
        bestPrediction.className
      );
    }

  } catch (error) {

    console.error(
      "Classification error:",
      error
    );
  }

  // Continue classification
  requestAnimationFrame(
    classifyPose
  );
}