// ==========================================
// 1. SETUP LINGKUNGAN 3D & PENCAHAYAAN
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 130; // Mundur sedikit lagi untuk bentuk Adam yang lebar

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Pencahayaan
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
const particleCount = 12000; // Sedikit ditambah untuk detail bentuk baru
const geometry = new THREE.SphereGeometry(0.12, 6, 6); 
const material = new THREE.MeshPhongMaterial({
    color: 0xffffff, shininess: 150, specular: 0xffffff 
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
// 3. PRE-KALKULASI BENTUK (MORPH TARGETS BARU)
// ==========================================
// Hapus 'moon', tambah 'cat' dan 'adam'
const targets = { saturn: [], scatter: [], heart: [], cat: [], jellyfish: [], text: [], fist: [], adam: [] };
const currentPositions = [];

// Helper Text
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
    const idx = i;
    
    // --- SATURNUS (Default) ---
    if (i < particleCount * 0.3) {
        const theta = u * Math.PI * 2; const phi = Math.acos((v * 2) - 1); const rPlanet = 18;
        targets.saturn.push({ x: rPlanet * Math.sin(phi) * Math.cos(theta), y: rPlanet * Math.sin(phi) * Math.sin(theta), z: rPlanet * Math.cos(phi) });
    } else {
        const thetaRing = u * Math.PI * 2; const rRing = 26 + v * 30;
        const tilt = 0.4;
        const fy = (Math.random()-0.5)*1.5; const fz = rRing * Math.sin(thetaRing);
        targets.saturn.push({ x: rRing * Math.cos(thetaRing), y: fy*Math.cos(tilt) - fz*Math.sin(tilt), z: fy*Math.sin(tilt) + fz*Math.cos(tilt) });
    }
    
    // --- SCATTER ---
    targets.scatter.push({ x: (Math.random() - 0.5) * 450, y: (Math.random() - 0.5) * 450, z: (Math.random() - 0.5) * 450 });
    
    // --- HEART (Dual Hand) ---
    const tH = u * Math.PI * 2; const rH = 2.5 * Math.sqrt(v);
    targets.heart.push({
        x: rH * 16 * Math.pow(Math.sin(tH), 3),
        y: rH * (13 * Math.cos(tH) - 5 * Math.cos(2*tH) - 2 * Math.cos(3*tH) - Math.cos(4*tH)),
        z: (Math.random() - 0.5) * 10
    });

    // --- CAT FACE (WAJAH KUCING - BARU) ---
    // Menggantikan Bulan Sabit. Distribusi probabilitas untuk wajah dan telinga.
    const catRand = Math.random();
    if (catRand > 0.3) {
        // Wajah (Elips agak pipih)
        const tC = u * Math.PI * 2; const rC = 25 * Math.sqrt(v);
        targets.cat.push({ x: rC * Math.cos(tC) * 1.2, y: rC * Math.sin(tC) * 0.9 - 5, z: (Math.random()-0.5)*5 });
    } else {
        // Telinga (Dua segitiga di atas)
        const side = Math.random() > 0.5 ? 1 : -1; // Kiri atau kanan
        // Matematika segitiga sederhana: Basis di y=5, puncak di y=25
        const earBaseX = 15 * side; const earTipX = 25 * side;
        const tEar = Math.random();
        const eX = (1-tEar)*earBaseX + tEar*earTipX + (Math.random()-0.5)*5;
        const eY = (1-tEar)*5 + tEar*25 + (Math.random()-0.5)*2;
        targets.cat.push({ x: eX, y: eY, z: (Math.random()-0.5)*5 });
    }

    
    // --- BEAUTIFUL JELLYFISH (UBUR-UBUR CANTIK - DIPERBAIKI) ---
    if (Math.random() > 0.35) {
        // Tentakel Bergelombang (Heliks Sinusoidal)
        const tId = Math.floor(Math.random() * 8); // 8 tentakel utama
        const tAngle = (tId / 8) * Math.PI * 2 + (Math.random()*0.2);
        const tY = -Math.random() * 70; // Panjang ke bawah
        const wave = Math.sin(tY * 0.15 + tId); // Gelombang berdasarkan kedalaman Y
        const tR = 15 + wave * 3; // Radius bervariasi
        targets.jellyfish.push({ x: tR * Math.cos(tAngle), y: tY, z: tR * Math.sin(tAngle) });
    } else {
        // Kubah Lonceng (Bell Shape menggunakan Cosine)
        const tD = u * Math.PI * 2; 
        const pD = v * Math.PI / 2; // 0 sampai PI/2
        const rDomeBase = 22;
        // Bentuk lonceng: Radius mengecil secara kosinus saat Y naik
        const currentR = rDomeBase * Math.cos(pD); 
        const domeY = 25 * Math.sin(pD); // Tinggi kubah
        targets.jellyfish.push({ x: currentR * Math.cos(tD), y: domeY, z: currentR * Math.sin(tD) });
    }
    
    // --- CREATION OF ADAM (LUKISAN TANGAN - BARU) ---
    // Menggantikan kecepatan cahaya. Prosedural dua lengan mendekat.
    const isLeftArm = Math.random() > 0.5;
    let aX, aY, aZ;
    // Parameter Lengan (tabung dengan variasi)
    const armLen = Math.random(); // Posisi sepanjang lengan (0 pangkal, 1 ujung jari)
    const armRad = 4 * (1 - armLen*0.4); // Lengan makin kurus ke ujung
    const armTheta = Math.random() * Math.PI * 2;

    if (isLeftArm) {
        // Lengan Kiri (Tuhan): Dari Kiri Atas (-70, 30) ke Tengah Kiri (-3, 2)
        const startX = -70, startY = 35, endX = -4, endY = 2;
        const baseX = startX + armLen * (endX - startX);
        const baseY = startY + armLen * (endY - startY);
        aX = baseX + armRad * Math.cos(armTheta);
        aY = baseY + armRad * Math.sin(armTheta) * 0.5; // Agak pipih
        aZ = armRad * Math.sin(armTheta);
    } else {
        // Lengan Kanan (Adam): Dari Kanan Bawah (70, -30) ke Tengah Kanan (3, -2)
        const startX = 70, startY = -35, endX = 4, endY = -2;
        const baseX = startX + armLen * (endX - startX);
        const baseY = startY + armLen * (endY - startY);
        aX = baseX + armRad * Math.cos(armTheta);
        aY = baseY + armRad * Math.sin(armTheta) * 0.5;
        aZ = armRad * Math.sin(armTheta);
    }
    targets.adam.push({ x: aX, y: aY, z: (Math.random()-0.5)*5 });


    // --- TEXT & FIST ---
    const tp = textPoints[i % textPoints.length];
    targets.text.push({ x: tp.x + (Math.random()-0.5)*0.5, y: tp.y + (Math.random()-0.5)*0.5, z: tp.z });
    targets.fist.push({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 });

    // Set posisi awal
    currentPositions.push({ x: targets.saturn[i].x, y: targets.saturn[i].y, z: targets.saturn[i].z });
}

// ==========================================
// 4. LOGIKA AI & GESTURE RECOGNITION
// ==========================================
let activeShape = 'saturn'; 
let handRotX = 0, handRotY = 0;
let targetZoom = 130;

function getDist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}

const videoElement = document.getElementById('webcam_video');
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

hands.onResults((results) => {
    let shapeFound = 'saturn';
    let controllingHand = null;
    const landmarks = results.multiHandLandmarks;

    // --- LOGIKA DUA TANGAN (Heart Hands) ---
    if (landmarks && landmarks.length === 2) {
        const hand1 = landmarks[0]; const hand2 = landmarks[1];
        if (getDist(hand1[8], hand2[8]) < 0.08 && getDist(hand1[4], hand2[4]) < 0.08) {
            shapeFound = 'heart';
            handRotX = 0; handRotY = 0; 
        } else { controllingHand = hand1; }
    } else if (landmarks && landmarks.length === 1) {
        controllingHand = landmarks[0];
    }

    // --- LOGIKA SATU TANGAN ---
    if (controllingHand && shapeFound === 'saturn') {
        const lm = controllingHand;
        const centerX = (lm[0].x + lm[9].x) / 2; const centerY = (lm[0].y + lm[9].y) / 2;
        handRotY = (centerX - 0.5) * Math.PI; handRotX = (centerY - 0.5) * Math.PI;
        const handWidth = getDist(lm[5], lm[17]); 
        targetZoom = Math.max(50, Math.min(250, 20 / (handWidth * 100))); 

        const dW = lm[0];
        const isIndexExt = getDist(lm[8], dW) > getDist(lm[5], dW);
        const isMiddleExt = getDist(lm[12], dW) > getDist(lm[9], dW);
        const isRingExt = getDist(lm[16], dW) > getDist(lm[13], dW);
        const isPinkyExt = getDist(lm[20], dW) > getDist(lm[17], dW);
        const isThumbIndexTouching = getDist(lm[4], lm[8]) < 0.05; 
        const isThumbExt = getDist(lm[4], lm[5]) > 0.08; 

        // Pemetaan Gestur Baru
        if (isThumbIndexTouching && isMiddleExt && isRingExt && isPinkyExt) {
            shapeFound = 'jellyfish'; // OK Sign -> Ubur-ubur Cantik
        } else if (!isThumbExt && !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt) {
            shapeFound = 'fist'; // Genggam
        } else if (isIndexExt && isMiddleExt && isRingExt && isPinkyExt) {
            shapeFound = 'scatter'; // Mekar
        } else if (isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt) {
            shapeFound = 'text'; // Peace Sign
        } else if (isIndexExt && !isMiddleExt && !isRingExt && isPinkyExt) {
            shapeFound = 'cat'; // Horns Sign -> Wajah Kucing (Baru)
        } else if (isThumbExt && !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt) {
             // Thumbs Up -> Creation of Adam (Baru, Statis)
            if (lm[4].y < lm[3].y) { shapeFound = 'adam'; }
        }
    } else if (!controllingHand && shapeFound === 'saturn') {
        targetZoom = 130; handRotX = 0; handRotY = 0;
    }
    activeShape = shapeFound;
});

const cameraUtil = new Camera(videoElement, { onFrame: async () => { await hands.send({ image: videoElement }); }, width: 640, height: 480 });
cameraUtil.start();

// ==========================================
// 5. ANIMASI MATRIKS 3D
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    camera.lookAt(scene.position);

    // Transisi Kamera & Rotasi
    camera.position.z += (targetZoom - camera.position.z) * 0.05;
    // Jika bentuk Adam atau Hati, kunci rotasi agar bentuknya jelas
    if (activeShape !== 'adam' && activeShape !== 'heart') {
        instancedMesh.rotation.x += (handRotX - instancedMesh.rotation.x) * 0.05;
        instancedMesh.rotation.y += (handRotY - instancedMesh.rotation.y) * 0.05;
        if (handRotY === 0) instancedMesh.rotation.y -= 0.003; // Auto rotate kanan
    } else {
        // Reset rotasi pelan-pelan ke depan untuk bentuk statis
        instancedMesh.rotation.x += (0 - instancedMesh.rotation.x) * 0.05;
        instancedMesh.rotation.y += (0 - instancedMesh.rotation.y) * 0.05;
    }

    const targetArr = targets[activeShape];
    const time = Date.now() * 0.002; // Waktu untuk animasi ubur-ubur

    for (let i = 0; i < particleCount; i++) {
        let cur = currentPositions[i];
        let tar = targetArr[i];
        let tX = tar.x, tY = tar.y, tZ = tar.z;
            
        // Animasi tambahan hanya untuk ubur-ubur
        if (activeShape === 'jellyfish') {
            // Kubah bernapas pelan
            if (tY > 0) { tX += Math.sin(time)*0.5; tZ += Math.cos(time)*0.5; }
            // Tentakel berayun sinusoidal
            else { tX += Math.sin(time + tY*0.05)*2; }
        }

        // Interpolasi posisi (Morphing)
        cur.x += (tX - cur.x) * 0.06;
        cur.y += (tY - cur.y) * 0.06;
        cur.z += (tZ - cur.z) * 0.06;

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