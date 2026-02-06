gsap.registerPlugin(Observer);

// ==========================================
// 1. SETUP: EARTH & STARS
// ==========================================
const world = Globe()
  (document.getElementById('earth-container'))
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundColor('rgba(0,0,0,0)') // Transparent background
  .atmosphereColor('#3a228a')
  .atmosphereAltitude(0.15);

// Add Realism (Clouds + Sun)
setTimeout(() => {
    const scene = world.scene();
    const globeObj = scene.children.find(obj => obj.type === 'Mesh');
    
    // Shiny Ocean Effect
    if(globeObj) {
        globeObj.material.shininess = 20;
        globeObj.material.color = new THREE.Color(0xffffff);
    }

    // Clouds
    const cloudGeo = new THREE.SphereGeometry(globeObj.geometry.parameters.radius * 1.01, 75, 75);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('//unpkg.com/three-globe/example/img/earth-clouds.png'),
        transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);
    world.cloudMesh = cloudMesh; // Save for rotation

    // Sun (Directional Light)
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(50, 50, 50);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x404040, 1));
    
    // Hide Loader
    document.getElementById('loader').style.opacity = 0; 
    setTimeout(() => { document.getElementById('loader').style.display = 'none'; }, 1000);
}, 1000);

// ==========================================
// 2. ANIMATION STATE MACHINE
// ==========================================

const JAIPUR_LAT = 26.9124;
const JAIPUR_LNG = 75.7873;
let params = { lat: 20, lng: -50, alt: 2.5 }; 
world.pointOfView(params);

// Scenes: 0:Intro -> 1:Spin -> 2:Profile -> 3:Dual -> 4:Skills
let currentScene = 0;
let isAnimating = false;

// Helper to update 3D View
function updateView() {
    world.pointOfView({ lat: params.lat, lng: params.lng, altitude: params.alt });
    if(world.cloudMesh) world.cloudMesh.rotation.y += 0.001;
}

// --- SCENE 1: SPIN TO INDIA ---
function playScene1() {
    isAnimating = true;
    
    // Hide Intro (autoAlpha 0 handles visibility too)
    gsap.to("#screen-intro", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to(params, {
        lat: JAIPUR_LAT,
        lng: JAIPUR_LNG - 360, // Full 360 spin
        duration: 3,
        ease: "power2.inOut",
        onUpdate: updateView,
        onComplete: () => {
            // Show "Target Locked"
            gsap.to("#screen-locked", { autoAlpha: 1, duration: 0.5 });
            isAnimating = false;
        }
    });
}

// --- SCENE 2: CRASH INTO PROFILE ---
function playScene2() {
    isAnimating = true;
    gsap.to("#screen-locked", { autoAlpha: 0, duration: 0.5 });

    // Zoom Earth
    gsap.to(params, {
        alt: 0.1, lat: JAIPUR_LAT, lng: JAIPUR_LNG,
        duration: 2, ease: "power2.in", onUpdate: updateView
    });

    // Fade Earth, Show Profile
    gsap.to("#earth-container", { opacity: 0, duration: 1, delay: 1.5 });
    
    gsap.to("#screen-profile", {
        autoAlpha: 1, // Visible!
        duration: 1, delay: 1.5,
        onStart: () => { document.querySelector('.profile-card').style.pointerEvents = 'auto'; },
        onComplete: () => { isAnimating = false; }
    });
}

// --- SCENE 3: DUAL PROTOCOL (Red/Blue) ---
function playScene3() {
    isAnimating = true;
    gsap.to("#screen-profile", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to("#screen-dual", {
        autoAlpha: 1, // Visible!
        duration: 1, delay: 0.5,
        onStart: () => { document.querySelector('.dual-container').style.pointerEvents = 'auto'; },
        onComplete: () => { isAnimating = false; }
    });
}

// --- SCENE 4: SKILLS HUD ---
function playScene4() {
    isAnimating = true;
    gsap.to("#screen-dual", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to("#screen-skills", {
        autoAlpha: 1, // Visible!
        duration: 1, delay: 0.5,
        onComplete: () => { isAnimating = false; }
    });
}

// --- INPUT CONTROLLER ---
Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    onDown: () => {
        if(isAnimating) return;
        if(currentScene === 0) { currentScene = 1; playScene1(); }
        else if(currentScene === 1) { currentScene = 2; playScene2(); }
        else if(currentScene === 2) { currentScene = 3; playScene3(); }
        else if(currentScene === 3) { currentScene = 4; playScene4(); }
    },
    tolerance: 10, preventDefault: true
});

// ==========================================
// 3. INTERACTIVE STARS (Background)
// ==========================================
const canvas = document.getElementById('star-field');
const ctx = canvas.getContext('2d');
let width, height, stars = [];
let mouse = { x: -1000, y: -1000 };

function initStars() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
    stars = [];
    for(let i=0; i<400; i++) {
        stars.push({
            x: Math.random()*width, y: Math.random()*height,
            size: Math.random()*2, alpha: Math.random(),
            vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5
        });
    }
}
window.addEventListener('resize', initStars);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

function animateStars() {
    ctx.clearRect(0,0,width,height);
    stars.forEach(star => {
        star.x += star.vx; star.y += star.vy;
        
        // Mouse Repulsion
        let dx = mouse.x - star.x;
        let dy = mouse.y - star.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 100) {
            star.x -= (dx/dist)*2;
            star.y -= (dy/dist)*2;
        }

        // Wrap around screen
        if(star.x < 0) star.x = width; if(star.x > width) star.x = 0;
        if(star.y < 0) star.y = height; if(star.y > height) star.y = 0;

        ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
        ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(animateStars);
}
initStars();
animateStars();