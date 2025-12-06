import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

// ----------------------------------------------------
// Bloch Vector (example)
// ----------------------------------------------------
const theta = Math.PI / 3;
const phi   = Math.PI / 4;

const blochVector = new THREE.Vector3(
    Math.sin(theta) * Math.cos(phi),
    Math.sin(theta) * Math.sin(phi),
    Math.cos(theta)
).normalize();

// ----------------------------------------------------
// Create a Bloch Sphere in a given container
// ----------------------------------------------------
function createBlochSphere(containerId, phiSliderId, thetaSliderId) {
    const container = document.getElementById(containerId);
    const phiSlider = document.getElementById(phiSliderId);
    const thetaSlider = document.getElementById(thetaSliderId);

    // ----- Scene -----
    const scene = new THREE.Scene();

    // Light gray background
    scene.background = new THREE.Color(0xf0f0f0);

    // ----- Camera -----
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );
    var camdist = 3.5
    var phiAngle = Math.PI/3.0
    var thetaAngle = Math.PI/2.0
    camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
    camera.position.y = camdist * Math.cos(thetaAngle);
    camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
    camera.lookAt(0, 0, 0);


    // ----- Renderer -----
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // ----------------------------------------------------
    // Bloch Sphere
    // ----------------------------------------------------
    const sphereGeom = new THREE.SphereGeometry(1, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x0080cc,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);

    // ----------------------------------------------------
    // Axes
    // ----------------------------------------------------
    const axesLength = 1.15;

    function makeAxis(dir, color) {
        const material = new THREE.LineBasicMaterial({ color: color, linewidth: 4 });
        const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(axesLength)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Line(geometry, material);
    }

    const axes = [
        makeAxis(new THREE.Vector3(1,0,0), 0xff0000),   // +X
        makeAxis(new THREE.Vector3(-1,0,0), 0xaa0000),  // -X
        makeAxis(new THREE.Vector3(0,1,0), 0x00cc00),   // +Y
        makeAxis(new THREE.Vector3(0,-1,0), 0x008800),  // -Y
        makeAxis(new THREE.Vector3(0,0,1), 0x0000ff),   // +Z
        makeAxis(new THREE.Vector3(0,0,-1), 0x000088)   // -Z
    ];
    axes.forEach(a => scene.add(a));

    // ----------------------------------------------------
    // Arrow for Bloch vector
    // ----------------------------------------------------
    var arrow = new THREE.ArrowHelper(
        blochVector,
        new THREE.Vector3(0, 0, 0),
        1.0,
        0xffaa00,
        0.25,
        0.2
    );
    scene.add(arrow);
// Public updater
container.updateBloch = function(vec3) {
    arrow.setDirection(vec3.clone().normalize());
};

    // ----------------------------------------------------
    // Axis Labels
    // ----------------------------------------------------
    function makeLabel(text, position) {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.font = "48px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, size/2, size/2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(0.5, 0.5, 1);
        sprite.position.copy(position);
        return sprite;
    }

    scene.add(makeLabel("|i⟩",   new THREE.Vector3(0, 0, 1.2)));
    scene.add(makeLabel("|-i⟩",  new THREE.Vector3(0, 0,-1.2)));
    scene.add(makeLabel("|+⟩",   new THREE.Vector3(1.2, 0, 0)));
    scene.add(makeLabel("|-⟩",  new THREE.Vector3(-1.2, 0, 0)));
    scene.add(makeLabel("|0⟩",   new THREE.Vector3(0, 1.2, 0)));
    scene.add(makeLabel("|1⟩",  new THREE.Vector3(0,-1.2, 0)));

    // ----------------------------------------------------
    // Update camera rotation from sliders
    // ----------------------------------------------------

    phiSlider.addEventListener("input", () => {
        phiAngle = -phiSlider.value * Math.PI / 180 + Math.PI/2.0; // degrees → radians
        if(thetaAngle == 0) {
            //this looks ugly but it is important to avoid loss of information in cicular coordinates
            camera.position.x = camdist * Math.cos(phiAngle) * 0.0001;
            camera.position.y = camdist;
            camera.position.z = camdist * Math.sin(phiAngle) *0.0001;
        }
        else{
            camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
            camera.position.y = camdist * Math.cos(thetaAngle);
            camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
        }
        camera.lookAt(0, 0, 0);
    });
    thetaSlider.addEventListener("input", () => {
        thetaAngle = thetaSlider.value * Math.PI / 180; // degrees → radians
        if(thetaAngle == 0) {
            //this looks ugly but it is important to avoid loss of information in cicular coordinates
            camera.position.x = camdist * Math.cos(phiAngle) * 0.0001;
            camera.position.y = camdist;
            camera.position.z = camdist * Math.sin(phiAngle) *0.0001;
        }
        else{
            camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
            camera.position.y = camdist * Math.cos(thetaAngle);
            camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
        }
        camera.lookAt(0, 0, 0);
    });

    // ----------------------------------------------------
    // Animation loop
    // ----------------------------------------------------
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // ----------------------------------------------------
    // Resize
    // ----------------------------------------------------
    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
}

function initCustomMatrix() {
    const matrixContainer = document.getElementById("custom-matrix");
    const btnCnot = document.getElementById("gate-cnot");
    const btnCz = document.getElementById("gate-cz");

    if (!matrixContainer || !btnCnot || !btnCz) return;

    const size = 4;
    const inputs = [];
    let selectedGate = null;

    // Build 4x4 grid
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.classList.add("matrix-cell");
            input.value = "0";

            input.addEventListener("input", () => {
                clearSelection();
            });

            matrixContainer.appendChild(input);
            inputs.push(input);
        }
    }

    function clearSelection() {
        selectedGate = null;
        btnCnot.classList.remove("selected");
        btnCz.classList.remove("selected");
    }

    function setMatrix(values) {
        for (let i = 0; i < 16; i++) {
            inputs[i].value = values[i];
        }
    }

    // CNOT button: set to standard 2-qubit CNOT (control qubit 1, target qubit 2)
// Basis order: |00>, |01>, |10>, |11>
btnCnot.addEventListener("click", () => {
    const cnotValues = [
        "1", "0", "0", "0",
        "0", "1", "0", "0",
        "0", "0", "0", "1",
        "0", "0", "1", "0"
    ];
    setMatrix(cnotValues);
    selectedGate = "CNOT";
    btnCnot.classList.add("selected");
    btnCz.classList.remove("selected");
});

   // CZ button: set to controlled-Z matrix
// Basis: |00>, |01>, |10>, |11>
btnCz.addEventListener("click", () => {
    // DECOMPOSE button (placeholder)
const btnDecompose = document.getElementById("gate-decompose");
btnDecompose.addEventListener("click", () => {
    alert("Coming soon: matrix → gate decomposition!");
});

    const czValues = [
        "1", "0", "0", "0",
        "0", "1", "0", "0",
        "0", "0", "1", "0",
        "0", "0", "0", "-1"
    ];
    setMatrix(czValues);
    selectedGate = "CZ";
    btnCz.classList.add("selected");
    btnCnot.classList.remove("selected");
});

}

// ----------------------------------------------------
// Create the two Bloch spheres
// ----------------------------------------------------
createBlochSphere("bloch-sphere-0", "cam-phi-0", "cam-theta-0");
createBlochSphere("bloch-sphere-1", "cam-phi-1", "cam-theta-1");

initCustomMatrix();

// =====================================================
// Probability Bar API (you call this to update bars)
// =====================================================

export function updateProbabilityBars(probabilities) {
    // expects array of 4 numbers between 0 and 1
    const ids = ["prob-00", "prob-01", "prob-10", "prob-11"];

    for (let i = 0; i < 4; i++) {
        const bar = document.getElementById(ids[i]);
        if (!bar) continue;

        // Scale bar height (max = 120px)
        bar.style.height = (probabilities[i] * 120) + "px";
    }
}

// Example default: equal superposition
window.addEventListener("DOMContentLoaded", () => {
    updateProbabilityBars([0.25, 0.25, 0.25, 0.25]);
});

// =====================================================
// State Info Tabs + Auto-Sync
// =====================================================

function initStateInfo() {
    const tabs = document.querySelectorAll(".state-tab");
    const panels = document.querySelectorAll(".state-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove("active"));

            // Hide all panels
            panels.forEach(p => p.classList.add("hidden"));

            // Activate clicked tab + show its panel
            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.remove("hidden");
        });
    });
}


window.addEventListener("DOMContentLoaded", initStateInfo);

// =====================================================
// 2-TAB AUTO-SYNC ENGINE (Complex Vector <-> Full 2-Qubit State)
// =====================================================

// -------- Complex number parser --------
function parseComplex(str) {
    str = str.trim();
    if (str === "") return null;

    // Pure imaginary (e.g., 0.5i, -2i)
    if (/^[+-]?\d*\.?\d*i$/.test(str)) {
        return { re: 0, im: parseFloat(str.replace("i","")) || 0 };
    }

    // a + bi
    const m = str.match(/^([+-]?\d*\.?\d*)([+-]\d*\.?\d*)i$/);
    if (m) return { re: parseFloat(m[1]), im: parseFloat(m[2]) };

    // Real only
    const n = parseFloat(str);
    if (!isNaN(n)) return { re: n, im: 0 };

    return null;
}

// -------- Complex multiply --------
function cMul(a,b){
    return { re: a.re*b.re - a.im*b.im,
             im: a.re*b.im + a.im*b.re };
}

// -------- Convert α,β → 4 amplitudes (tensor product) --------
// |ψ⟩ = α|0⟩ + β|1⟩ for each qubit
// Full 2-qubit state = (α|0⟩ + β|1⟩) ⊗ (α|0⟩ + β|1⟩)
function fullToVector(alpha, beta) {
    return [
        cMul(alpha, alpha), // |00>
        cMul(alpha, beta),  // |01>
        cMul(beta, alpha),  // |10>
        cMul(beta, beta)    // |11>
    ];
}

// -------- Convert vector → α, β (approx for separable states) --------
function cSqrt(z){
    const r = Math.sqrt(Math.sqrt(z.re*z.re + z.im*z.im));
    const theta = Math.atan2(z.im, z.re) / 2;
    return { re: r*Math.cos(theta), im: r*Math.sin(theta) };
}

function vectorToFull(vec) {
    return {
        alpha: cSqrt(vec[0]), // α ≈ sqrt(a00)
        beta:  cSqrt(vec[3])  // β ≈ sqrt(a11)
    };
}

// -------- Formatting back to text --------
function cToString(z){
    let re = z.re.toFixed(3);
    let im = z.im.toFixed(3);
    if (z.im >= 0) return `${re}+${im}i`;
    return `${re}${im}i`;
}

// -------- Normalize a vector --------
function normalize(vec) {
    let norm = Math.sqrt(vec.reduce((s,v)=> s + (v.re*v.re + v.im*v.im), 0));
    if (norm === 0) return vec;
    return vec.map(v => ({ re: v.re/norm, im: v.im/norm }));
}

// -------- Fill UI functions --------
function fillVectorInputs(vec) {
    const ids = ["vec-00","vec-01","vec-10","vec-11"];
    for (let i=0;i<4;i++){
        document.getElementById(ids[i]).value = cToString(vec[i]);
    }
}

function fillFullInputs(alpha, beta){
    document.getElementById("alpha").value = cToString(alpha);
    document.getElementById("beta").value  = cToString(beta);
}
// ===============================
// Convert 2-qubit vector -> Bloch vectors
// ===============================

// Given amplitudes [a00, a01, a10, a11], compute Bloch vectors for each qubit.
function getBlochVectors(vec) {
    // Extract amplitudes
    const a00 = vec[0];
    const a01 = vec[1];
    const a10 = vec[2];
    const a11 = vec[3];

    // Helper to compute ⟨ψ|σ|ψ⟩
    const exp = (re, im) => ({ re, im });

    function sigmaX(q) {
        return q.re;
    }

    // Reduced density matrices
    // ρ0 (trace out qubit 1)
    const rho0 = {
        xx: { re: a00.re*a00.re + a01.re*a01.re + a00.im*a00.im + a01.im*a01.im },
        zz: { re: a00.re*a00.re + a10.re*a10.re + a00.im*a00.im + a10.im*a10.im }
    };

    // BUT we actually want direct expectation formulas:
    // <X> = 2 Re(a00*conj(a10) + a01*conj(a11))
    // <Y> = 2 Im(a00*conj(a10) + a01*conj(a11))
    // <Z> = |a00|² + |a01|² - |a10|² - |a11|²

    function blochForQubit0() {
        const x = 2 * (
            a00.re*a10.re + a00.im*a10.im +
            a01.re*a11.re + a01.im*a11.im
        );
        const y = 2 * (
            a00.re*a10.im - a00.im*a10.re +
            a01.re*a11.im - a01.im*a11.re
        );
        const z =
            (a00.re*a00.re + a00.im*a00.im + a01.re*a01.re + a01.im*a01.im) -
            (a10.re*a10.re + a10.im*a10.im + a11.re*a11.re + a11.im*a11.im);

        return new THREE.Vector3(x, y, z).normalize();
    }

    // For qubit 1, same formulas but grouping amplitudes by second index:
    function blochForQubit1() {
        const x = 2 * (
            a00.re*a01.re + a00.im*a01.im +
            a10.re*a11.re + a10.im*a11.im
        );
        const y = 2 * (
            a00.re*a01.im - a00.im*a01.re +
            a10.re*a11.im - a10.im*a11.re
        );
        const z =
            (a00.re*a00.re + a00.im*a00.im + a10.re*a10.re + a10.im*a10.im) -
            (a01.re*a01.re + a01.im*a01.im + a11.re*a11.re + a11.im*a11.im);

        return new THREE.Vector3(x, y, z).normalize();
    }

    return {
        bloch0: blochForQubit0(),
        bloch1: blochForQubit1()
    };
}

// =====================================================
// APPLY STATE (reads whichever tab is active)
// =====================================================
function applyState(){

    const active = document.querySelector(".state-tab.active").dataset.target;

    // -------- CASE 1: User entered a 4-amplitude vector --------
    if (active === "state-vector"){

        const ids = ["vec-00","vec-01","vec-10","vec-11"];
        let vec = [];

        for (let id of ids){
            let c = parseComplex(document.getElementById(id).value);
            if (!c){ alert("Invalid complex amplitude"); return; }
            vec.push(c);
        }

        vec = normalize(vec);

        // Convert vector → α,β
        const { alpha, beta } = vectorToFull(vec);
        fillFullInputs(alpha, beta);
    }

    // -------- CASE 2: User entered α, β --------
    else if (active === "state-full"){

        let alpha = parseComplex(document.getElementById("alpha").value);
        let beta  = parseComplex(document.getElementById("beta").value);

        if (!alpha || !beta){
            alert("Invalid α or β");
            return;
        }

        // Convert α,β → full vector
        let vec = fullToVector(alpha, beta);
        vec = normalize(vec);
        fillVectorInputs(vec);
    }
}

// Attach button
document.getElementById("apply-state-btn").addEventListener("click", applyState);
