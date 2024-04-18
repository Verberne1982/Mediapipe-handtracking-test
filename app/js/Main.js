// Importeer de HandLandmarker- en FilesetResolver-klassen van de MediaPipe-bibliotheek.
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Variabelen voor de HandLandmarker, de knop om de webcam te activeren, en of de webcam actief is.
let handLandmarker = undefined;
let enableWebcamButton;
let webcamRunning = false;

// Functie om de HandLandmarker-klasse te maken wanneer deze is geladen.
const createHandLandmarker = async () => {
  // Haal de FilesetResolver op voor visuele taken.
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
  // Maak een HandLandmarker-object met de gewenste opties.
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `models/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2
  });
};
// Roep de functie aan om de HandLandmarker te maken.
createHandLandmarker();

// Haal de video- en canvaselementen op uit het HTML-document.
const video = document.getElementById("webcam");
const canvas = document.getElementById("output_canvas");
const ctx = canvas.getContext("2d");

// Functie om te controleren of de browser toegang heeft tot de webcam.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// Voeg een eventlistener toe aan de knop om de webcam te activeren wanneer deze wordt geklikt.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() wordt niet ondersteund door uw browser");
}

// Functie om de webcam te activeren en de handtracking te starten.
function enableCam(event) {
  if (!handLandmarker) {
    console.log("Wacht! HandLandmarker is nog niet geladen.");
    return;
  }

  // Wissel de status van de webcamRunning-variabele en pas de knoptekst aan.
  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS";

  // Definieer de constraints voor het verkrijgen van de webcamstream.
  const constraints = { video: true };

  // Vraag toegang tot de webcam en start de handtracking wanneer de stream beschikbaar is.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
    video.style.transform = "scaleX(-1)"; // Spiegel de webcamfeed
  });
}

// Variabelen voor het bijhouden van de tijd en de resultaten van de handtracking.
let lastVideoTime = -1;
let results = undefined;

// Functie om de handtracking op de webcamstream uit te voeren.
async function predictWebcam() {
  // Pas de afmetingen van het canvas aan op basis van de grootte van de video.
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Bepaal het starttijdstip voor de handtracking.
  let startTimeMs = performance.now();

  // Voer handtracking uit als de video is bijgewerkt sinds het laatste frame.
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }

  // Wis het canvas en teken de handtrackingresultaten als die beschikbaar zijn.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (results?.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 1 });
      drawLandmarks(ctx, landmarks, { color: "#0000FF", lineWidth: 1 });
    }
  }

  // Blijf de functie recursief aanroepen als de webcam actief is.
  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}
