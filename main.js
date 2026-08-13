// TO ALL COLLABORATORS PLEASE DON'T TOUCH MAIN WITHOUT PHILIPE'S PERMISSION!

let model;
let webcam;

let label = "Nothing";

// ==========================
// DETECTION SETTINGS
// ==========================

let wordSpeedSeconds = 5;
let detectionInterval = wordSpeedSeconds * 1000;

let lastDetectionTime = 0;

let helloProcessed = false;

// ==========================
// SPEECH SETTINGS
// ==========================

let voices = [];

// ==========================
// MODEL SETTINGS
// ==========================

let modelURL =
  "https://teachablemachine.withgoogle.com/models/13zhEz0nX/";

let modelLinkField = null;
let loadModelButton = null;

// ==========================
// BASIC COMMUNICATION BOARD
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
  "Maybe",
  "Advanced",
  "Settings"
];

// ==========================
// ADVANCED KEYBOARD
// ==========================

const advancedWords = [
  "ABCD",
  "EFGH",
  "IJKL",
  "MNOP",
  "QRST",
  "UVWXYZ",
  "Space",
  "Delete",
  "Delete All",
  "Say",
  "Basic"
];

// ==========================
// SETTINGS
// ==========================

const speedOptions = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10"
];

// ==========================
// KEYBOARD STATE
// ==========================

let selectedIndex = 0;
let buttons = [];

let board;
let appRoot;

let currentMode = "basic";

let settingsActive = false;

// ==========================
// LETTER SUB-BOARD STATE
// ==========================

let currentLetterGroup = "";

// ==========================
// MESSAGE STATE
// ==========================

let messageText = "";
let messageField = null;

// ==========================
// SETUP
// ==========================

async function setup() {

  appRoot = select("#app-root");

  createCanvas(
    400,
    45
  ).parent(appRoot);

  loadVoices();

  // ==========================
  // LOAD DEFAULT MODEL
  // ==========================

  try {

    model = await tmPose.load(
      modelURL + "model.json",
      modelURL + "metadata.json"
    );

    console.log(
      "Pose model loaded!"
    );

    console.log(
      "Classes:",
      model.getTotalClasses()
    );

  } catch (error) {

    console.error(
      "MODEL LOAD ERROR:",
      error
    );

    label =
      "Model Error";

    return;
  }

  // ==========================
  // MODEL CONTROLS
  // ==========================

  createModelControls();

  // ==========================
  // TEACHABLE MACHINE WEBCAM
  // ==========================

  try {

    const size = 400;
    const flip = true;

    webcam = new tmPose.Webcam(
      size,
      size,
      flip
    );

    await webcam.setup();
    await webcam.play();

    console.log(
      "Teachable Machine webcam started!"
    );

    const webcamCanvas =
      webcam.canvas;

    webcamCanvas.id =
      "lumen-webcam";

    webcamCanvas.style.width =
      "400px";

    webcamCanvas.style.height =
      "400px";

    webcamCanvas.style.display =
      "block";

    appRoot.elt.insertBefore(
      webcamCanvas,
      appRoot.elt.firstChild
    );

  } catch (error) {

    console.error(
      "WEBCAM ERROR:",
      error
    );

    label =
      "Camera Error";

    return;
  }

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

  background(0);

  fill(255);

  textSize(20);

  textAlign(
    CENTER,
    CENTER
  );

  text(
    label,
    width / 2,
    height / 2
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
// MODEL CONTROLS
// ==========================

function createModelControls() {

  let modelControls =
    createDiv();

  modelControls.parent(
    appRoot
  );

  modelControls.addClass(
    "model-controls"
  );

  modelControls.style(
    "width",
    "400px"
  );

  modelControls.style(
    "margin-bottom",
    "10px"
  );

  // ==========================
  // MODEL LINK FIELD
  // ==========================

  modelLinkField =
    createInput(
      modelURL,
      "Insert Teachable Machine Link"
    );

  modelLinkField.parent(
    modelControls
  );

  modelLinkField.addClass(
    "model-link-field"
  );

  modelLinkField.style(
    "width",
    "100%"
  );

  modelLinkField.style(
    "height",
    "40px"
  );

  modelLinkField.style(
    "box-sizing",
    "border-box"
  );

  // ==========================
  // LOAD MODEL BUTTON
  // ==========================

  loadModelButton =
    createButton(
      "Load Model"
    );

  loadModelButton.parent(
    modelControls
  );

  loadModelButton.addClass(
    "communication-button"
  );

  loadModelButton.style(
    "width",
    "100%"
  );

  loadModelButton.style(
    "margin-top",
    "8px"
  );

  loadModelButton.mousePressed(
    () => {

      loadNewModel();
    }
  );
}

// ==========================
// LOAD NEW MODEL
// ==========================

async function loadNewModel() {

  if (
    !modelLinkField
  ) {

    label =
      "Model Link Error";

    return;
  }

  let enteredURL =
    modelLinkField
      .value()
      .trim();

  if (
    enteredURL.length === 0
  ) {

    label =
      "Insert Model Link";

    return;
  }

  // ==========================
  // CLEAN URL
  // ==========================

  if (
    !enteredURL.endsWith("/")
  ) {

    enteredURL += "/";
  }

  // ==========================
  // LOAD MODEL
  // ==========================

  try {

    label =
      "Loading Model...";

    console.log(
      "LOADING MODEL:",
      enteredURL
    );

    const newModel =
      await tmPose.load(
        enteredURL + "model.json",
        enteredURL + "metadata.json"
      );

    // ==========================
    // CHECK CLASS COUNT
    // ==========================

    const totalClasses =
      newModel.getTotalClasses();

    console.log(
      "MODEL CLASS COUNT:",
      totalClasses
    );

    if (
      totalClasses !== 2
    ) {

      console.error(
        "MODEL ERROR: Model must contain exactly 2 classes."
      );

      label =
        "Need Hello + Nothing";

      return;
    }

    // ==========================
    // CHECK CLASS NAMES
    // ==========================

    if (
      !webcam ||
      !webcam.canvas
    ) {

      label =
        "Camera Not Ready";

      return;
    }

    const {
      pose,
      posenetOutput
    } =
      await newModel.estimatePose(
        webcam.canvas
      );

    const predictions =
      await newModel.predict(
        posenetOutput
      );

    const classNames =
      predictions.map(
        prediction =>
          prediction.className
      );

    console.log(
      "MODEL CLASSES:",
      classNames
    );

    const hasHello =
      classNames.some(
        name =>
          name
            .trim()
            .toLowerCase() ===
          "hello"
      );

    const hasNothing =
      classNames.some(
        name =>
          name
            .trim()
            .toLowerCase() ===
          "nothing"
      );

    // ==========================
    // REQUIRE HELLO + NOTHING
    // ==========================

    if (
      !hasHello ||
      !hasNothing
    ) {

      console.error(
        "MODEL ERROR: Classes must be Hello and Nothing."
      );

      label =
        "Need Hello + Nothing";

      return;
    }

    // ==========================
    // ACCEPT MODEL
    // ==========================

    model =
      newModel;

    modelURL =
      enteredURL;

    helloProcessed =
      false;

    lastDetectionTime =
      millis();

    label =
      "Model Loaded";

    console.log(
      "MODEL SUCCESSFULLY LOADED!"
    );

    console.log(
      "MODEL URL:",
      modelURL
    );

    console.log(
      "MODEL CLASSES: Hello, Nothing"
    );

  } catch (error) {

    console.error(
      "MODEL LOAD ERROR:",
      error
    );

    label =
      "Model Load Error";
  }
}

// ==========================
// CREATE COMMUNICATION BOARD
// ==========================

function createCommunicationBoard() {

  board = createDiv();

  board.parent(
    appRoot
  );

  board.addClass(
    "communication-board"
  );

  board.style(
    "position",
    "relative"
  );

  renderBoard();
}

// ==========================
// RENDER CURRENT BOARD
// ==========================

function renderBoard() {

  board.elt.innerHTML = "";

  buttons = [];

  selectedIndex = 0;

  // ==========================
  // BASIC
  // ==========================

  if (
    currentMode === "basic"
  ) {

    renderBasicBoard();

    return;
  }

  // ==========================
  // ADVANCED
  // ==========================

  if (
    currentMode === "advanced"
  ) {

    renderAdvancedBoard();

    return;
  }

  // ==========================
  // LETTER MODE
  // ==========================

  if (
    currentMode === "letters"
  ) {

    renderLetterBoard();

    return;
  }

  // ==========================
  // SETTINGS
  // ==========================

  if (
    currentMode === "settings"
  ) {

    renderSettingsBoard();

    return;
  }
}

// ==========================
// RENDER BASIC BOARD
// ==========================

function renderBasicBoard() {

  for (
    let i = 0;
    i < words.length;
    i++
  ) {

    const word =
      words[i];

    let button =
      createButton(
        word
      );

    button.parent(
      board
    );

    button.addClass(
      "communication-button"
    );

    if (
      word === "Advanced"
    ) {

      button.addClass(
        "advanced-button"
      );

      button.style(
        "width",
        "100%"
      );
    }

    if (
      word === "Settings"
    ) {

      button.addClass(
        "settings-button"
      );

      button.style(
        "width",
        "100%"
      );
    }

    button.mousePressed(
      () => {

        activateButton(
          word
        );
      }
    );

    buttons.push(
      button
    );
  }

  updateSelector();

  console.log(
    "BOARD MODE: basic"
  );
}

// ==========================
// RENDER ADVANCED BOARD
// ==========================

function renderAdvancedBoard() {

  createMessageField();
  board.style(
    "padding-top",
    "45px"
  );

  for (
    let i = 0;
    i < advancedWords.length;
    i++
  ) {

    const word =
      advancedWords[i];

    let button =
      createButton(
        word
      );

    button.parent(
      board
    );

    button.addClass(
      "communication-button"
    );

    button.mousePressed(
      () => {

        activateButton(
          word
        );
      }
    );

    buttons.push(
      button
    );
  }

  updateSelector();

  console.log(
    "BOARD MODE: advanced"
  );
}

// ==========================
// CREATE MESSAGE FIELD
// ==========================

function createMessageField() {

  messageField = null;

  messageField =
    createInput(
      messageText,
      "Type or build a message..."
    );

  messageField.parent(
    board
  );

  messageField.addClass(
    "advanced-message-field"
  );

  board.style(
    "position",
    "relative"
  );

  messageField.style(
    "position",
    "absolute"
  );

  messageField.style(
    "left",
    "0px"
  );

  messageField.style(
    "top",
    "-10px"
  );

  messageField.style(
    "width",
    "100%"
  );

  messageField.style(
    "height",
    "40px"
  );

  messageField.style(
    "box-sizing",
    "border-box"
  );

  messageField.style(
    "z-index",
    "100"
  );

  // ==========================
  // MANUAL TYPING
  // ==========================

  messageField.input(
    () => {

      messageText =
        messageField.value();

      label =
        messageText ||
        "Nothing";

      console.log(
        "MESSAGE:",
        messageText
      );
    }
  );
}

// ==========================
// RENDER LETTER BOARD
// ==========================

function renderLetterBoard() {

  board.elt.innerHTML = "";

  buttons = [];

  selectedIndex = 0;

  createMessageField();

  for (
    let i = 0;
    i < currentLetterGroup.length;
    i++
  ) {

    const letter =
      currentLetterGroup[i];

    let button =
      createButton(
        letter
      );

    button.parent(
      board
    );

    button.addClass(
      "communication-button"
    );

    button.mousePressed(
      () => {

        activateButton(
          letter
        );
      }
    );

    buttons.push(
      button
    );
  }

  // ==========================
  // BACK BUTTON
  // ==========================

  let backButton =
    createButton(
      "Back"
    );

  backButton.parent(
    board
  );

  backButton.addClass(
    "communication-button"
  );

  backButton.mousePressed(
    () => {

      switchToAdvanced();
    }
  );

  buttons.push(
    backButton
  );

  updateSelector();

  console.log(
    "LETTER BOARD:",
    currentLetterGroup
  );
}

// ==========================
// RENDER SETTINGS BOARD
// ==========================

function renderSettingsBoard() {

  for (
    let i = 0;
    i < speedOptions.length;
    i++
  ) {

    const speed =
      speedOptions[i];

    let button =
      createButton(
        speed
      );

    button.parent(
      board
    );

    // SAME STYLE AS BASIC
    button.addClass(
      "communication-button"
    );

    button.mousePressed(
      () => {

        setWordSpeed(
          Number(speed)
        );
      }
    );

    buttons.push(
      button
    );
  }

  // ==========================
  // BACK BUTTON
  // ==========================

  let backButton =
    createButton(
      "Back"
    );

  backButton.parent(
    board
  );

  // SAME STYLE AS BASIC
  backButton.addClass(
    "communication-button"
  );

  backButton.mousePressed(
    () => {

      deactivateSettings();
    }
  );

  buttons.push(
    backButton
  );

  updateSelector();

  console.log(
    "BOARD MODE: settings"
  );
}

// ==========================
// UPDATE MESSAGE FIELD
// ==========================

function updateMessageField() {

  if (
    messageField
  ) {

    messageField.value(
      messageText
    );
  }
}

// ==========================
// SETTINGS
// ==========================

function activateSettings() {

  settingsActive = true;

  currentMode =
    "settings";

  currentLetterGroup =
    "";

  selectedIndex = 0;

  label =
    "Settings";

  renderBoard();

  console.log(
    "SETTINGS ACTIVATED"
  );
}

// ==========================
// SET WORD SPEED
// ==========================

function setWordSpeed(seconds) {

  if (
    seconds < 1 ||
    seconds > 10
  ) {

    return;
  }

  wordSpeedSeconds =
    seconds;

  detectionInterval =
    wordSpeedSeconds * 1000;

  label =
    "Word Speed: " +
    wordSpeedSeconds +
    "s";

  for (
    let i = 0;
    i < buttons.length;
    i++
  ) {

    if (
      Number(
        buttons[i].html()
      ) ===
      wordSpeedSeconds
    ) {

      buttons[i].addClass(
        "active"
      );

      selectedIndex =
        i;

    } else {

      buttons[i].removeClass(
        "active"
      );
    }
  }

  lastDetectionTime =
    millis();

  console.log(
    "WORD SPEED:",
    wordSpeedSeconds
  );
}

// ==========================
// DEACTIVATE SETTINGS
// ==========================

function deactivateSettings() {

  settingsActive = false;

  currentMode =
    "basic";

  currentLetterGroup =
    "";

  selectedIndex = 0;

  renderBoard();

  label =
    "Settings Off";

  console.log(
    "SETTINGS DEACTIVATED"
  );
}

// ==========================
// SWITCH TO ADVANCED
// ==========================

function switchToAdvanced() {

  currentMode =
    "advanced";

  currentLetterGroup =
    "";

  selectedIndex = 0;

  label =
    "Advanced";

  renderBoard();

  console.log(
    "SWITCHING TO ADVANCED KEYBOARD"
  );
}

// ==========================
// SWITCH TO BASIC
// ==========================

function switchToBasic() {

  currentMode =
    "basic";

  currentLetterGroup =
    "";

  selectedIndex = 0;

  label =
    "Basic";

  renderBoard();

  console.log(
    "SWITCHING TO BASIC KEYBOARD"
  );
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

      buttons[i].addClass(
        "active"
      );

    } else {

      buttons[i].removeClass(
        "active"
      );
    }
  }
}

// ==========================
// MOVE SELECTOR
// ==========================

function moveSelector() {

  selectedIndex++;

  if (
    selectedIndex >=
    buttons.length
  ) {

    selectedIndex = 0;
  }

  updateSelector();

  if (
    buttons[selectedIndex]
  ) {

    console.log(
      "GREEN SELECTOR:",
      buttons[
        selectedIndex
      ].html()
    );
  }
}

// ==========================
// SPEECH
// ==========================

function speak(text) {

  if (
    !text ||
    text.length === 0
  ) {

    console.log(
      "Nothing to say."
    );

    return;
  }

  window.speechSynthesis.cancel();

  const speech =
    new SpeechSynthesisUtterance(
      text
    );

  speech.volume = 1;
  speech.rate = 1;
  speech.pitch = 1;

  const englishVoice =
    voices.find(
      (voice) =>
        voice.lang.startsWith("en")
    );

  if (
    englishVoice
  ) {

    speech.voice =
      englishVoice;
  }

  speech.onstart = () => {

    console.log(
      "Speaking:",
      text
    );
  };

  speech.onerror = (
    error
  ) => {

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
// ACTIVATE BUTTON
// ==========================

function activateButton(word) {

  // ==========================
  // BASIC
  // ==========================

  if (
    currentMode === "basic"
  ) {

    if (
      word === "Advanced"
    ) {

      switchToAdvanced();

      return;
    }

    if (
      word === "Settings"
    ) {

      activateSettings();

      return;
    }

    speak(
      word
    );

    return;
  }

  // ==========================
  // ADVANCED
  // ==========================

  if (
    currentMode === "advanced"
  ) {

    // --------------------------
    // LETTER GROUPS
    // --------------------------

    if (
      word === "ABCD" ||
      word === "EFGH" ||
      word === "IJKL" ||
      word === "MNOP" ||
      word === "QRST" ||
      word === "UVWXYZ"
    ) {

      openLetterGroup(
        word
      );

      return;
    }

    // --------------------------
    // SPACE
    // --------------------------

    if (
      word === "Space"
    ) {

      messageText +=
        " ";

      updateMessageField();

      label =
        messageText ||
        "Nothing";

      console.log(
        "SPACE ADDED"
      );

      return;
    }

    // --------------------------
    // BASIC
    // --------------------------

    if (
      word === "Basic"
    ) {

      switchToBasic();

      return;
    }

    // --------------------------
    // DELETE
    // --------------------------

    if (
      word === "Delete"
    ) {

      if (
        messageText.length > 0
      ) {

        messageText =
          messageText.slice(
            0,
            -1
          );
      }

      updateMessageField();

      label =
        messageText ||
        "Nothing";

      console.log(
        "DELETED ONE CHARACTER"
      );

      return;
    }

    // --------------------------
    // DELETE ALL
    // --------------------------

    if (
      word === "Delete All"
    ) {

      messageText = "";

      updateMessageField();

      label =
        "Nothing";

      console.log(
        "MESSAGE CLEARED"
      );

      return;
    }

    // --------------------------
    // SAY
    // --------------------------

    if (
      word === "Say"
    ) {

      if (
        messageText.length > 0
      ) {

        speak(
          messageText
        );

        label =
          "Saying: " +
          messageText;

      } else {

        console.log(
          "Nothing to say."
        );

        label =
          "Nothing";
      }

      return;
    }
  }

  // ==========================
  // LETTER MODE
  // ==========================

  if (
    currentMode === "letters"
  ) {

    // --------------------------
    // BACK
    // --------------------------

    if (
      word === "Back"
    ) {

      switchToAdvanced();

      return;
    }

    // --------------------------
    // INDIVIDUAL LETTER
    // --------------------------

    if (
      word.length === 1
    ) {

      messageText +=
        word;

      updateMessageField();

      label =
        messageText;

      console.log(
        "LETTER SELECTED:",
        word
      );

      console.log(
        "MESSAGE:",
        messageText
      );

      return;
    }
  }

  // ==========================
  // SETTINGS MODE
  // ==========================

  if (
    currentMode === "settings"
  ) {

    const speed =
      Number(word);

    if (
      speed >= 1 &&
      speed <= 10
    ) {

      setWordSpeed(
        speed
      );

      return;
    }

    if (
      word === "Back"
    ) {

      deactivateSettings();

      return;
    }
  }
}

// ==========================
// OPEN LETTER GROUP
// ==========================

function openLetterGroup(group) {

  currentLetterGroup =
    group;

  currentMode =
    "letters";

  selectedIndex = 0;

  label =
    group;

  renderBoard();

  console.log(
    "OPENING LETTER GROUP:",
    group
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

    label =
      "Nothing";

    moveSelector();

    helloProcessed =
      false;

    return;
  }

  // ==========================
  // HELLO / INPUT
  // ==========================

  if (
    normalizedLabel ===
    "hello"
  ) {

    label =
      "Input Detected";

    if (
      !helloProcessed
    ) {

      const selectedButton =
        buttons[
          selectedIndex
        ];

      if (
        selectedButton
      ) {

        const selectedWord =
          selectedButton.html();

        console.log(
          "INPUT DETECTED → ACTIVATING:",
          selectedWord
        );

        activateButton(
          selectedWord
        );
      }

      helloProcessed =
        true;
    }

    return;
  }
}

// ==========================
// CLASSIFICATION
// ==========================

async function classifyPose() {

  try {

    if (
      !model ||
      !webcam ||
      !webcam.canvas
    ) {

      requestAnimationFrame(
        classifyPose
      );

      return;
    }

    // ==========================
    // UPDATE WEBCAM
    // ==========================

    webcam.update();

    // ==========================
    // POSE ESTIMATION
    // ==========================

    const {
      pose,
      posenetOutput
    } =
      await model.estimatePose(
        webcam.canvas
      );

    // ==========================
    // CLASSIFICATION
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
    // DETECTION COOLDOWN
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

  requestAnimationFrame(
    classifyPose
  );
}