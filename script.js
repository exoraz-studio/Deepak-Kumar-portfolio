gsap.registerPlugin(Observer);

// ==========================================
// PART 1: THE EARTH ENGINE
// ==========================================

const world = Globe()
  (document.getElementById('earth-container'))
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundColor('rgba(0,0,0,0)') // Transparent for stars
  .atmosphereColor('#3a228a')
  .atmosphereAltitude(0.15);

// Add Realism (Clouds + Sun)
setTimeout(() => {
    const scene = world.scene();
    const globeObj = scene.children.find(obj => obj.type === 'Mesh');
    
    // Shiny Ocean
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
    // Save cloud mesh to rotate it later
    world.cloudMesh = cloudMesh;

    // Sun
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(50, 50, 50);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x404040, 1));
    
    document.getElementById('loader').style.opacity = 0;
}, 1000);

// ==========================================
// PART 2: ANIMATION & SWAY LOGIC
// ==========================================

const JAIPUR_LAT = 26.9124;
const JAIPUR_LNG = 75.7873;

// Base parameters (Where the animation puts the camera)
let params = { lat: 20, lng: -50, alt: 2.5 }; 

// Mouse Tracking for Sway
let mouseXRatio = 0; // -0.5 to 0.5
let mouseYRatio = 0; // -0.5 to 0.5

window.addEventListener('mousemove', (e) => {
    // Calculate 0.0 to 1.0, then shift to -0.5 to 0.5 for centering
    mouseXRatio = (e.clientX / window.innerWidth) - 0.5;
    mouseYRatio = (e.clientY / window.innerHeight) - 0.5;
});

// The Master Update Function
function updateView() {
    // 1. Calculate Sway (The "Screen Moving" Effect)
    // Strength: 10 degrees lat/lng, 0.1 altitude
    const swayLat = mouseYRatio * 10; 
    const swayLng = mouseXRatio * -10; // Negative to invert natural feel
    
    // 2. Apply to Globe
    world.pointOfView({ 
        lat: params.lat + swayLat, 
        lng: params.lng + swayLng, 
        altitude: params.alt 
    });

    // 3. Rotate Clouds slowly (Visual Bonus)
    if(world.cloudMesh) {
        world.cloudMesh.rotation.y += 0.0005;
    }
}

// Start the loop so sway works even when not scrolling
// We use GSAP ticker for a smooth 60fps loop
gsap.ticker.add(updateView);


// ==========================================
// PART 3: SCROLL MOVIES (THE TRIGGER LOGIC)
// ==========================================

let currentState = 0; 
let isAnimating = false;

// Movie 1: Spin to India
function goToIndia() {
    isAnimating = true;
    gsap.to("#text-phase-1", { opacity: 0, duration: 0.5 });
    
    gsap.to(params, {
        lat: JAIPUR_LAT,
        lng: JAIPUR_LNG - 360, 
        duration: 3, // Slightly slower for dramatic effect
        ease: "power2.inOut",
        onComplete: () => {
            gsap.to("#text-phase-2", { opacity: 1, duration: 0.5 });
            isAnimating = false;
        }
    });
}

// Movie 2: Crash into India & Reveal Profile
function goToProfile() {
    isAnimating = true;
    gsap.to("#text-phase-2", { opacity: 0, duration: 0.5 });
    
    gsap.to(params, {
        alt: 0.05, 
        lat: JAIPUR_LAT,
        lng: JAIPUR_LNG,
        duration: 2.5,
        ease: "power2.in", 
    });

    gsap.to("#earth-container", { opacity: 0, duration: 1, delay: 2 });
    
    gsap.to("#profile-card", {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        delay: 1.8, 
        ease: "back.out(1.7)", 
        onComplete: () => { isAnimating = false; }
    });
}

Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    onDown: () => { 
        if (isAnimating) return;
        if (currentState === 0) { currentState = 1; goToIndia(); }
        else if (currentState === 1) { currentState = 2; goToProfile(); }
    },
    tolerance: 10,
    preventDefault: true
});

// ==========================================
// PART 4: INTERACTIVE STAR FIELD (UPDATED)
// ==========================================

const canvas = document.getElementById('star-field');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];
let starMouse = { x: -1000, y: -1000 }; 

// CONFIGURATION
const STAR_COUNT = 800; // Increased from 200 to 800
const REPULSION_RADIUS = 120;
const REPULSION_STRENGTH = 4;

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initStars();
}

function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        stars.push({
            x: x, y: y,
            originX: x, originY: y,
            size: Math.random() * 2, // Varied sizes
            alpha: Math.random(), // Varied brightness
            vx: 0, vy: 0
        });
    }
}

window.addEventListener('mousemove', (e) => {
    starMouse.x = e.clientX;
    starMouse.y = e.clientY;
});

function animateStars() {
    ctx.clearRect(0, 0, width, height);
    
    stars.forEach(star => {
        const dx = starMouse.x - star.x;
        const dy = starMouse.y - star.y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < REPULSION_RADIUS) {
            const force = (REPULSION_RADIUS - distance) / REPULSION_RADIUS;
            const angle = Math.atan2(dy, dx);
            star.vx -= Math.cos(angle) * force * REPULSION_STRENGTH;
            star.vy -= Math.sin(angle) * force * REPULSION_STRENGTH;
        }

        const homeDx = star.originX - star.x;
        const homeDy = star.originY - star.y;
        star.vx += homeDx * 0.05; 
        star.vy += homeDy * 0.05;
        star.vx *= 0.85; 
        star.vy *= 0.85;

        star.x += star.vx;
        star.y += star.vy;

        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(animateStars);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animateStars();