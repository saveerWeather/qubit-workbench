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
            tabs.forEach(t => t.classList.remove("active"));
            panels.forEach(p => p.classList.add("hidden"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.remove("hidden");
        });
    });

    // Build density matrix inputs
    const densityGrid = document.getElementById("density-grid");
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("input");
        cell.type = "text";
        cell.placeholder = `ρ${Math.floor(i/4)}${i%4}`;
        cell.id = `rho-${i}`;
        densityGrid.appendChild(cell);
    }
}

window.addEventListener("DOMContentLoaded", initStateInfo);

// ============================================================
// AUTO-SYNC USING THE APPLY STATE BUTTON
// ============================================================

// Parse complex like "0.5", "0.5i", "-0.2 + 0.7i"
function parseComplex(str) {
    str = str.replace(/\s+/g, "");
    if (str === "") return math.complex(0,0);
    if (!str.match(/[ij]/)) return math.complex(parseFloat(str), 0);
    return math.complex(str.replace("i","j"));
}

// Convert complex → string
function cToString(c) {
    let re = Number(c.re.toFixed(4));
    let im = Number(c.im.toFixed(4));
    if (im === 0) return `${re}`;
    if (re === 0) return `${im}i`;
    if (im > 0) return `${re} + ${im}i`;
    return `${re} - ${Math.abs(im)}i`;
}

// Normalize a 4-component complex vector
function normalize(vec) {
    let norm = Math.sqrt(vec.reduce((s,v) => s + v.abs()**2, 0));
    return vec.map(v => v.div(norm));
}

// Build 4×4 density matrix ρ = |ψ⟩⟨ψ|
function vectorToDensity(vec) {
    let rho = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            rho.push(vec[i].mul(vec[j].conjugate()));
        }
    }
    return rho;
}

// Compute reduced Bloch vector for qubit 0 or 1
function densityToBloch(rho, qubit) {

    // reshape to 4×4
    let R = [];
    for (let i = 0; i < 4; i++) R[i] = rho.slice(4*i,4*i+4);

    let offset = qubit === 1 ? 2 : 0;

    let red = [
        [ math.complex(0,0), math.complex(0,0) ],
        [ math.complex(0,0), math.complex(0,0) ]
    ];

    for (let a=0; a<2; a++) {
        for (let b=0; b<2; b++) {
            red[a][b] = R[a+offset][b+offset];
        }
    }

    let x = math.re(red[0][1] + red[1][0]);
    let y = math.re(math.complex(0,-1) * (red[0][1] - red[1][0]));
    let z = math.re(red[0][0] - red[1][1]);

    return {x,y,z};
}

// APPLY STATE BUTTON
document.getElementById("apply-state-btn").addEventListener("click", () => {

    let activeTab = document.querySelector(".state-tab.active").dataset.target;

    /* ---------------------------------------------------------
       CASE 1 — USER ENTERED COMPLEX VECTOR
       --------------------------------------------------------- */
    if (activeTab === "state-vector") {

        let vec = [
            parseComplex(document.getElementById("vec-00").value),
            parseComplex(document.getElementById("vec-01").value),
            parseComplex(document.getElementById("vec-10").value),
            parseComplex(document.getElementById("vec-11").value)
        ];

        vec = normalize(vec);

        let rho = vectorToDensity(vec);

        // Fill density matrix
        rho.forEach((c,i) => {
            document.getElementById(`rho-${i}`).value = cToString(c);
        });

        // Fill Bloch XYZ
        let b0 = densityToBloch(rho,0);
        let b1 = densityToBloch(rho,1);

        document.getElementById("bloch0-x").value = b0.x.toFixed(4);
        document.getElementById("bloch0-y").value = b0.y.toFixed(4);
        document.getElementById("bloch0-z").value = b0.z.toFixed(4);

        document.getElementById("bloch1-x").value = b1.x.toFixed(4);
        document.getElementById("bloch1-y").value = b1.y.toFixed(4);
        document.getElementById("bloch1-z").value = b1.z.toFixed(4);
    }

});

