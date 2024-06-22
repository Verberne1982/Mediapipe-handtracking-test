# Motion Tracking Library
Deze bibliotheek maakt gebruik van MediaPipe's PoseLandmarker voor real-time pose tracking met behulp van een webcam. Hieronder vind je instructies om aan de slag te gaan met de bibliotheek en enkele voorbeelden van mogelijke toepassingen.

## Installatie
Voeg de bibliotheek toe aan je project met behulp van een scripttag:

```html
<script type="module">
  import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils
  } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
</script>
```

## Gebruik
Initialisatie van PoseLandmarker:

Voordat je pose tracking kunt uitvoeren, moet je de PoseLandmarker initialiseren met de gewenste opties. Zorg ervoor dat je de FilesetResolver gebruikt om visuele taken te laden:

```javascript
const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: `./models/pose_landmarker_full.task`,
    delegate: "GPU",
  },
  runningMode: "VIDEO",
  numPoses: 2,
});
```

## Webcam Activeren:

Voeg een HTML-button toe om de webcam te activeren en pose tracking te starten:

```html
<button id="webcamButton">Start Webcam</button>
<video id="webcam" autoplay playsinline></video>
<canvas id="output_canvas"></canvas>
<canvas id="ThreeJS_output"></canvas>

<script>
const enableWebcamButton = document.getElementById("webcamButton");
enableWebcamButton.addEventListener("click", enableCam);
</script>

```
## Pose Tracking Starten:

Zodra de webcam is gestart, kun je pose tracking starten en visuele feedback weergeven:

```javascript
async function enableCam() {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('output_canvas');

  // Activeer de webcam en stel videoElement in
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoElement.srcObject = stream;

  // Start pose tracking
  await predictWebcam(videoElement, canvasElement);
}

async function predictWebcam(videoElement, canvasElement) {
  const ctx = canvasElement.getContext('2d');
  const results = await poseLandmarker.estimatePoses(videoElement);

  // Verwerk de resultaten en voer acties uit op basis van de pose data
  results.forEach(pose => {
    // Voer hier verdere verwerking uit, zoals het aanpassen van 3D objecten
    // gebaseerd op pose landmarks
  });

  requestAnimationFrame(() => predictWebcam(videoElement, canvasElement));
}
```

## Voorbeelden van Functionaliteit
### Update van Kubuspositie

Gebruik handlandmarks om de positie van een 3D-object, zoals een kubus, dynamisch bij te werken.
```javascript
function updateCubePositionX(landmarks) {
  // Implementatie om positie langs x-as te updaten op basis van handlandmarks
}
```
### Schaal aanpassen
Pas de schaal van een 3D-object aan op basis van de afstand tussen specifieke handlandmarks.

```javascript
function cubeScaling(landmarks) {
  // Implementatie om schaal van een kubus aan te passen op basis van handlandmarks
}
```

### Hoogte aanpassen
Pas de hoogte van een kubus aan op basis van handlandmarks.

```javascript
function cubeJump(landmarks) {
  // Implementatie om hoogte van een kubus aan te passen op basis van handlandmarks
}
```

### Actie detecteren
Detecteer een specifiek handgebaar, zoals een vuist, en voer een bijbehorende actie uit.

```javascript
function detectAction(landmarks) {
  // Implementatie om een actie uit te voeren bij detectie van een handgebaar (bijv. vuist)
}
```

### Interactie detecteren
Start of stop de rotatie van een kubus op basis van handlandmarks.

```javascript
function detectInteraction(landmarks) {
  // Implementatie om rotatie van een kubus te starten of stoppen op basis van handlandmarks
}
```
  
## Bijdragen
Bijdragen aan deze bibliotheek zijn welkom. Zorg ervoor dat je nieuwe functies toevoegt volgens de SOLID principes en OOP richtlijnen voor een gestructureerde en onderhoudbare codebase.

## Bronnen
- https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
- https://threejs.org/

