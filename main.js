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

//=============================================================================================
// THIS IS THE MODEL URL (GET THIS FROM THE POSE MODEL IN TEACHABLE MACHINE)  V V V V
//============================================================================================
const modelURL =
  "https://teachablemachine.withgoogle.com/models/jaOMYzL7l/";

// ==========================
// COMMUNICATION BOARD
// ==========================

//This is an array of word choices, feel free to change the words in the array to change the word buttons on the screen!
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
let appRoot;

// ==========================
// SETUP
// ==========================

// BTW async means that it is an asynchronous function (makes promises) *brings in the model

async function setup() {
  appRoot = select("#app-root");
  createCanvas(400, 400).parent(appRoot);

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
  image(video, 0, 0, 400, 400);

  fill(0);
  rect(0, 0, width, 45);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(label, width / 2, 22.5);
}

// ==========================
// VOICE BUTTON
// ==========================

function createVoiceButton() {
  let voiceButton = createButton("🔊 Enable Voice");
  voiceButton.parent(appRoot);
  voiceButton.addClass("voice-button");

  voiceButton.mousePressed(() => {
    voiceEnabled = true;
    speak("Voice enabled");
    voiceButton.html("🔊 Voice Enabled");
    console.log("Voice enabled!");
  });
}

// ==========================
// LOAD VOICES
// ==========================

function loadVoices() {
  voices = window.speechSynthesis.getVoices();

  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
    console.log("Available voices:", voices.length);
  };
}

// ==========================
// COMMUNICATION BOARD
// ==========================

function createCommunicationBoard() {
  board = createDiv();
  board.parent(appRoot);
  board.addClass("communication-board");

  for (let i = 0; i < words.length; i++) {
    let button = createButton(words[i]);
    button.parent(board);
    button.addClass("communication-button");

    button.mousePressed(() => {
      speak(words[i]);
    });

    buttons.push(button);
  }

  updateSelector();
}

// ==========================
// UPDATE GREEN SELECTOR
// ==========================

function updateSelector() {
  for (let i = 0; i < buttons.length; i++) {
    if (i === selectedIndex) {
      buttons[i].addClass("active");
    } else {
      buttons[i].removeClass("active");
    }
  }
}

// ==========================
// MOVE SELECTOR
// ==========================

function moveSelector() {
  selectedIndex++;

  if (selectedIndex >= words.length) {
    selectedIndex = 0;
  }

  updateSelector();
  console.log("GREEN SELECTOR:", words[selectedIndex]);
}

// ==========================
// SPEECH
// ==========================

function speak(text) {
  if (!voiceEnabled) {
    console.log("Voice is not enabled yet.");
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);

  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;

  const englishVoice = voices.find((voice) => voice.lang.startsWith("en"));

  if (englishVoice) {
    speech.voice = englishVoice;
  }

  speech.onstart = () => {
    console.log("Speaking:", text);
  };

  speech.onerror = (error) => {
    console.error("Speech error:", error);
  };

  window.speechSynthesis.speak(speech);
}

// ==========================
// HANDLE CLASSIFICATION
// ==========================

function handleLabel(newLabel) {
  const normalizedLabel = newLabel.trim().toLowerCase();

  console.log("Accepted detection:", normalizedLabel);

  if (normalizedLabel === "nothing") {
    label = "Nothing";
    console.log("NOTHING DETECTED → MOVE SELECTOR");
    moveSelector();
    helloProcessed = false;
    return;
  }

  if (normalizedLabel === "hello") {
    label = "Input";

    if (!helloProcessed) {
      console.log("HELLO DETECTED → SPEAKING:", words[selectedIndex]);
      speak(words[selectedIndex]);
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
    const { pose, posenetOutput } = await model.estimatePose(video.elt);
    const predictions = await model.predict(posenetOutput);

    let bestPrediction = predictions[0];

    for (let i = 1; i < predictions.length; i++) {
      if (predictions[i].probability > bestPrediction.probability) {
        bestPrediction = predictions[i];
      }
    }

    const currentTime = millis();

    if (currentTime - lastDetectionTime >= detectionInterval) {
      lastDetectionTime = currentTime;

      console.log("Prediction:", bestPrediction.className, bestPrediction.probability);
      handleLabel(bestPrediction.className);
    }
  } catch (error) {
    console.error("Classification error:", error);
  }

  requestAnimationFrame(classifyPose);
}
