// Importeer de HandLandmarker- en FilesetResolver-klassen van de MediaPipe-bibliotheek.
import * as THREE from 'three';
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Variabelen voor de HandLandmarker, de knop om de webcam te activeren, en of de webcam actief is.
let handLandmarker = undefined;
let enableWebcamButton;
let webcamRunning = false;
let renderer; // Declareer de renderer variabele
let camera; // Declareer de camera variabele
let scene;
let cube; // Declareer de kubus variabele
let detected = false;

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
const threeJS = document.getElementById("ThreeJS_output");
const ctx = canvas.getContext("2d");






// Functie om de positie van de kubus bij te werken op basis van handtracking
let previousX = 0;
let previousY = 0;
let previousZ = 0;
const smoothingFactor = 0.2;

// Variabelen voor pinch-detectie en rotatie
let isPinching = false;
let previousPinchX = 0;
let previousPinchY = 0;

function updateCubePosition(handLandmarks) {
  if (!handLandmarks) return;

  // Handposities zijn relatief aan het canvas, we moeten ze converteren naar de positie in de 3D-ruimte
  const targetX = (handLandmarks[8].x - 0.6) * 10; // Schaal x-coördinaat naar -5 tot 5
  const targetY = -(handLandmarks[8].y - 0.6) * 10; // Schaal y-coördinaat naar -5 tot 5
  const targetZ = (handLandmarks[0].z - 0.6) * 2; // Schaal z-coördinaat naar -5 tot 5

  // Smoothing door een bewegingsgemiddelde
  const x = previousX + (targetX - previousX) * smoothingFactor;
  const y = previousY + (targetY - previousY) * smoothingFactor;
  const z = previousZ + (targetZ - previousZ) * smoothingFactor;

  // Controleer of een van de coördinaten NaN is
  if (isNaN(x) || isNaN(y) || isNaN(z)) return;

  // Update previous values
  previousX = x;
  previousY = y;
  previousZ = z;

  // Set the position of the cube
  cube.position.set(x, y, z);

  // Detect pinch
  const pinchX = handLandmarks[8].x;
  const pinchY = handLandmarks[8].y;
  const thumbX = handLandmarks[4].x;
  const thumbY = handLandmarks[4].y;

  const distance = Math.sqrt((pinchX - thumbX) ** 2 + (pinchY - thumbY) ** 2);

  if (distance < 0.05) { // Drempelwaarde voor pinch-detectie
    if (!isPinching) {
      // Start van een pinch
      isPinching = true;
      previousPinchX = pinchX;
      previousPinchY = pinchY;
    } else {
      // Continu pinch - bereken rotatie
      const deltaX = pinchX - previousPinchX;
      const deltaY = pinchY - previousPinchY;

      // Update de rotatie van de kubus
      cube.rotation.y += deltaX * 4 * Math.PI; // Roteer rond de y-as
      cube.rotation.x += deltaY * 4 * Math.PI; // Roteer rond de x-as

      // Update vorige pinch waarden
      previousPinchX = pinchX;
      previousPinchY = pinchY;
    }
  } else {
    isPinching = false;
  }
}
function updateCubeScale(handLandmarks) {
  if (!handLandmarks) return;

  const thumbTip = handLandmarks[4];
  const indexTip = handLandmarks[17];

  const distance = Math.sqrt(
    (thumbTip.x - indexTip.x) ** 2 + (thumbTip.y - indexTip.y) ** 2 + (thumbTip.z - indexTip.z) ** 2
  );

  cube.scale.set(distance * 10, distance * 10, distance * 10);
}
function updateCubeRotation(handLandmarks) {
  if (!handLandmarks) return;

  const palmNormalX = handLandmarks[0].x - handLandmarks[9].x;
  const palmNormalY = handLandmarks[0].y - handLandmarks[9].y;

  cube.rotation.y = palmNormalX * Math.PI;
  cube.rotation.x = palmNormalY * Math.PI;
}
let previousSwipeX = 0;
let previousSwipeY = 0;

function updateCubeSwipe(handLandmarks) {
  if (!handLandmarks) return;

  const swipeX = handLandmarks[9].x;
  const swipeY = handLandmarks[9].y;

  const deltaX = swipeX - previousSwipeX;
  const deltaY = swipeY - previousSwipeY;

  if (Math.abs(deltaX) > 0.05) {
    cube.position.x += deltaX * 10;
  }

  if (Math.abs(deltaY) > 0.05) {
    cube.position.y -= deltaY * 10;
  }

  previousSwipeX = swipeX;
  previousSwipeY = swipeY;
}
function detectThumbsUp(handLandmarks) {
  if (!handLandmarks) return;

  const thumbTip = handLandmarks[4];
  const indexBase = handLandmarks[5];

  if (thumbTip.y < indexBase.y) {
    cube.material.color.set(0x00ff00); // Change color to green
  } else {
    cube.material.color.set(0xff0000); // Change color to red
  }
}






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

    initializeThreeJS(); // Initialiseer Three.js nadat de video is geladen
    
    //video.style.transform = "scaleX(-1)"; // Spiegel de webcamfeed
  });
}

// Functie om Three.js te initialiseren en een kubus bovenop de webcamfeed weer te geven
function initializeThreeJS() {
  const canvasWidth = 400;
  const canvasHeight = 300;
  const aspectRatio = canvasWidth / canvasHeight;

  // Maak een renderer voor Three.js
  renderer = new THREE.WebGLRenderer({ canvas: threeJS });
  renderer.setSize(canvasWidth, canvasHeight);

  // Maak een camera
  camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
  camera.position.z = 5; // Zet de camera terug om de kubus te zien

  // Maak een Three.js-scène
  scene = new THREE.Scene();

  // Maak een kubus
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  cube = new THREE.Mesh(geometry, material);
  // Voeg randen toe aan de kubus voor visualisatie
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
  const cubeEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  cube.add(cubeEdges);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);

  // Voeg de kubus toe aan de scène
  scene.add(cube);

  // Render de scene
  function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    //updateCubePosition(results?.landmarks); // Update de kubuspositie met handlandmarks
  }
  render();
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
    results = await handLandmarker.detectForVideo(video, startTimeMs);
  }

  // Wis het canvas en teken de handtrackingresultaten als die beschikbaar zijn.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (results?.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 1 });
      drawLandmarks(ctx, landmarks, { color: "#0000FF", lineWidth: 1 });

      updateCubePosition(landmarks); // Update de kubuspositie met handlandmarks
      //updateCubeSwipe(landmarks); // Swipe-gebaar voor beweging
      //updateCubeRotation(landmarks); // Open hand voor rotatie
      updateCubeScale(landmarks); // Vuist voor schalen
      detectThumbsUp(landmarks); // Duim omhoog voor kleurverandering
    }
  }

  // Blijf de functie recursief aanroepen als de webcam actief is.
  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}
