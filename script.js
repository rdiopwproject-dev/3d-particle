// ==========================================
// 1. SETUP LINGKUNGAN 3D & PENCAHAYAAN
// ==========================================
const scene = new THREE.Scene();
// Mundur sedikit agar Saturnus terlihat penuh dan nyaman dipandang
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 120; 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Pencahayaan untuk efek reflektif
const ambientLight = new THREE.AmbientLight(0x404040, 2); 
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(50, 50, 100);
scene.add(directionalLight);
const pointLight = new THREE.PointLight(0x00ffff, 1.5, 200);
camera.add(pointLight); 
scene.add(camera);

// ==========================================
// 2. SETUP INSTANCED MESH (PARTIKEL DEBU)
// ==========================================
const particleCount = 10000; 
// Ukuran kecil (0.12) untuk efek debu
const geometry = new THREE.SphereGeometry(0.12, 6, 6); 
const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 150, 
    specular: 0xffffff 
});

const instancedMesh = new THREE.InstancedMesh(geometry, material, particleCount);
const dummy = new THREE.Object3D(); 

const palette = [
    new THREE.Color(0xFFFFFF), new THREE.Color(0xFFFFDD), new THREE.Color(0xFFFF00),
    new THREE.Color(0x00FFFF), new THREE.Color(0x0000FF), new THREE.Color(0x00FF00)
];

for (let i = 0; i < particleCount; i++) {
    const color = palette[Math.floor(Math.random() * palette.length)];
    instancedMesh.setColorAt(i, color);
}
instancedMesh.instanceColor.needsUpdate = true;
scene.add(instancedMesh);

// ==========================================
// 3. PRE-KALKULASI BENTUK (MORPH TARGETS)
// ==========================================
const targets = { saturn: [], scatter: [], heart: [], moon: [], jellyfish: [], text: [], fist: [] };
const currentPositions = [];

function generateTextPoints(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 100px Arial'; ctx.fillStyle = '#FFF'; ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, 130);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const points = [];
    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            if (data[(y * canvas.width + x) * 4] > 128) {
                points.push({ x: (x - canvas.width/2) * 0.15, y: -(y - canvas.height/2) * 0.15, z: (Math.random() - 0.5) * 5 });
            }
        }
    }
    return points;
}
const textPoints = generateTextPoints("I MISS YOU");

for (let i = 0; i < particleCount; i++) {
    const u = Math.random(); const v = Math.random();
    
    // SATURNUS (Bentuk Dasar)
    if (i < particleCount * 0.4) {
        const theta = u * Math.PI * 2; const phi = Math.acos((v * 2) - 1); const rPlanet = 20;
        targets.saturn.push({
            x: rPlanet * Math.sin(phi) * Math.cos(theta),
            y: rPlanet * Math.sin(phi) * Math.sin(theta),
            z: rPlanet * Math.cos(phi)
        });
    } else {
        const thetaRing = u * Math.PI * 2;
        const rRingInner = 28; const rRingOuter = 55;
        const rRing = rRingInner + v * (rRingOuter - rRingInner);
        const flatZ = rRing * Math.sin(thetaRing);
        const flatY = (Math.random() - 0.5) * 1.5; 
        const tilt = 0.35; // Kemiringan cincin
        targets.saturn.push({
            x: rRing * Math.cos(thetaRing),
            y: flatY * Math.cos(tilt) - flatZ * Math.sin(tilt),
            z: flatY * Math.sin(tilt) + flatZ * Math.cos(tilt)
        });
    }
    
    // SCATTER
    targets.scatter.push({ x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, z: (Math.random() - 0.5) * 400 });
    
    // HEART (Bentuk Hati)
    const tHeart = u * Math.PI * 2; const rHeart = 2.5 * Math.sqrt(v);
    targets.heart.push({
        x: rHeart * 16 * Math.pow(Math.sin(tHeart), 3),
        y: rHeart * (13 * Math.cos(tHeart) - 5 * Math.cos(2*tHeart) - 2 * Math.cos(3*tHeart) - Math.cos(4*tHeart)),
        z: (Math.random() - 0.5) * 10
    });
    
    // MOON
    const tMoon = (u * Math.PI) - Math.PI/2; const rMoon = 30 + (Math.random() * 5); const inR = 25 + (Math.random() * 5);
    targets.moon.push({
        x: Math.random() > 0.5 ? rMoon * Math.cos(tMoon) : inR * Math.cos(tMoon) + 15,
        y: Math.random() > 0.5 ? rMoon * Math.sin(tMoon) : inR * Math.sin(tMoon),
        z: (Math.random() - 0.5) * 5
    });
    
    // JELLYFISH
    if (Math.random() > 0.3) {
        targets.jellyfish.push({ x: (Math.random() - 0.5) * 20, y: -Math.random() * 60, z: (Math.random() - 0.5) * 20 });
    } else {
        const tD = u * Math.PI * 2; const pD = (v * Math.PI) / 2; const rD = 20;
        targets.jellyfish.push({ x: rD * Math.sin(pD) * Math.cos(tD), y: rD * Math.cos(pD), z: rD * Math.sin(pD) * Math.sin(tD) });
    }
    
    // TEXT
    const tp = textPoints[i % textPoints.length];
    targets.text.push({ x: tp.x + (Math.random()-0.5)*0.5, y: tp.y + (Math.random()-0.5)*0.5, z: tp.z });

    // FIST
    targets.fist.push({ x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 3 });

    // Initial Pos (Saturnus)
    currentPositions.push({ x: targets.saturn[i].x, y: targets.saturn[i].y, z: targets.saturn[i].z });
}

// ==========================================
// 4. LOGIKA AI PRESISI (SINGLE & DUAL HANDS)
// ==========================================
let activeShape = 'saturn'; 
let handRotX = 0, handRotY = 0;
let targetZoom = 120;
let isLightspeed = false;

// Fungsi Jarak Euclidean standar
function getDist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}

const videoElement = document.getElementById('webcam_video');
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });

// PERUBAHAN PENTING: maxNumHands diubah menjadi 2
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

hands.onResults((results) => {
    // Reset state per frame
    let shapeFound = 'saturn';
    isLightspeed = false;
    let controllingHand = null; // Tangan utama yang mengontrol kamera

    const landmarks = results.multiHandLandmarks;

    // --- LOGIKA DUA TANGAN (Prioritas Utama: Heart Hands) ---
    if (landmarks && landmarks.length === 2) {
        const hand1 = landmarks[0];
        const hand2 = landmarks[1];

        // Landmark 8 adalah ujung telunjuk, Landmark 4 adalah ujung jempol
        // Hitung jarak antara ujung telunjuk tangan 1 dan ujung telunjuk tangan 2
        const indexTipsDist = getDist(hand1[8], hand2[8]);
        // Hitung jarak antara ujung jempol tangan 1 dan ujung jempol tangan 2
        const thumbTipsDist = getDist(hand1[4], hand2[4]);

        // Toleransi jarak 0.08 (sekitar 8% dari lebar frame) dianggap bersentuhan
        if (indexTipsDist < 0.08 && thumbTipsDist < 0.08) {
            shapeFound = 'heart';
            // Jika membentuk hati, kunci rotasi kamera agar bentuk hati terlihat jelas
            handRotX = 0; handRotY = 0; 
        } else {
            // Jika 2 tangan tapi tidak membentuk hati, gunakan tangan pertama untuk kontrol kamera
            controllingHand = hand1;
        }
    } 
    // --- LOGIKA SATU TANGAN (Jika Heart Hands tidak terdeteksi) ---
    else if (landmarks && landmarks.length === 1) {
        controllingHand = landmarks[0];
    }

    // Proses Gestur Satu Tangan jika ada controllingHand
    if (controllingHand && shapeFound === 'saturn') {
        const lm = controllingHand;
        
        // Transformasi Kamera
        const centerX = (lm[0].x + lm[9].x) / 2;
        const centerY = (lm[0].y + lm[9].y) / 2;
        handRotY = (centerX - 0.5) * Math.PI; 
        handRotX = (centerY - 0.5) * Math.PI;

        const handWidth = getDist(lm[5], lm[17]); 
        targetZoom = Math.max(40, Math.min(250, 18 / (handWidth * 100))); 

        // Analisis Jari (Euclidean Distance dari pergelangan)
        const dWrist = lm[0];
        const isIndexExt = getDist(lm[8], dWrist) > getDist(lm[5], dWrist);
        const isMiddleExt = getDist(lm[12], dWrist) > getDist(lm[9], dWrist);
        const isRingExt = getDist(lm[16], dWrist) > getDist(lm[13], dWrist);
        const isPinkyExt = getDist(lm[20], dWrist) > getDist(lm[17], dWrist);
        
        const thumbIndexDist = getDist(lm[4], lm[8]);
        const isThumbIndexTouching = thumbIndexDist < 0.05; 
        const isThumbExt = getDist(lm[4], lm[5]) > 0.1; 

        // Evaluasi Gestur Satu Tangan
        // (Catatan: Gesture 'heart' satu tangan (finger heart) dihapus agar tidak bentrok)
        if (isThumbIndexTouching && isMiddleExt && isRingExt && isPinkyExt) {
            shapeFound = 'jellyfish'; // OK Sign
        } else if (!isThumbExt && !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt) {
            shapeFound = 'fist'; // Menggenggam
        } else if (isIndexExt && isMiddleExt && isRingExt && isPinkyExt) {
            shapeFound = 'scatter'; // Mekar
        } else if (isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt) {
            shapeFound = 'text'; // Peace Sign
        } else if (isIndexExt && !isMiddleExt && !isRingExt && isPinkyExt) {
            shapeFound = 'moon'; // Horns Sign
        } else if (isThumbExt && !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt) {
             // Thumbs Up (Vertikal)
            if (lm[4].y < lm[3].y && lm[3].y < lm[2].y) {
                isLightspeed = true; 
            }
        }
    } else if (!controllingHand && shapeFound === 'saturn') {
        // Tidak ada tangan sama sekali
        targetZoom = 120;
        handRotX = 0; handRotY = 0;
    }

    activeShape = shapeFound;
});

const cameraUtil = new Camera(videoElement, { onFrame: async () => { await hands.send({ image: videoElement }); }, width: 640, height: 480 });
cameraUtil.start();

// ==========================================
// 5. ANIMASI MATRIKS 3D SEJATI
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    camera.lookAt(scene.position);

    // Transisi Kamera
    camera.position.z += (targetZoom - camera.position.z) * 0.05;
    instancedMesh.rotation.x += (handRotX - instancedMesh.rotation.x) * 0.05;
    instancedMesh.rotation.y += (handRotY - instancedMesh.rotation.y) * 0.05;

    // Rotasi dasar ke kanan (clockwise) jika tidak dikontrol tangan
    // Nilai negatif pada sumbu Y = rotasi ke kanan
    if (handRotY === 0 && activeShape !== 'heart') {
        instancedMesh.rotation.y -= 0.003;
    }

    const targetArr = targets[activeShape];

    for (let i = 0; i < particleCount; i++) {
        let cur = currentPositions[i];
        let tar = targetArr[i];

        if (isLightspeed) {
            cur.z += 15;
            if (cur.z > 200) {
                cur.x = (Math.random() - 0.5) * 400; cur.y = (Math.random() - 0.5) * 400; cur.z = -200 - (Math.random() * 200);
            }
        } else {
            let tX = tar.x, tY = tar.y, tZ = tar.z;
            
            if (activeShape === 'jellyfish') {
                const time = Date.now() * 0.003;
                if (tY >= 0) {
                    tX += Math.sin(time) * 2; tZ += Math.cos(time) * 2;
                } else {
                    tX += Math.sin(time + tY * 0.1) * 3;
                }
            }

            cur.x += (tX - cur.x) * 0.05;
            cur.y += (tY - cur.y) * 0.05;
            cur.z += (tZ - cur.z) * 0.05;
        }

        dummy.position.set(cur.x, cur.y, cur.z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => { 
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
});

animate();