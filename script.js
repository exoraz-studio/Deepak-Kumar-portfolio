gsap.registerPlugin(Observer);

// ==========================================
// 1. SETUP: EARTH & STARS
// ==========================================
const world = Globe()
  (document.getElementById('earth-container'))
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundColor('rgba(0,0,0,0)') 
  .atmosphereColor('#3a228a')
  .atmosphereAltitude(0.15);

// Add Realism (Clouds + Sun)
setTimeout(() => {
    const scene = world.scene();
    const globeObj = scene.children.find(obj => obj.type === 'Mesh');
    
    if(globeObj) {
        globeObj.material.shininess = 20;
        globeObj.material.color = new THREE.Color(0xffffff);
    }

    const cloudGeo = new THREE.SphereGeometry(globeObj.geometry.parameters.radius * 1.01, 75, 75);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('//unpkg.com/three-globe/example/img/earth-clouds.png'),
        transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);
    world.cloudMesh = cloudMesh; 

    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(50, 50, 50);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x404040, 1));
    
}, 500); // Start fast

// ==========================================
// 2. ANIMATION STATE MACHINE
// ==========================================

const JAIPUR_LAT = 26.9124;
const JAIPUR_LNG = 75.7873;
let params = { lat: 20, lng: -50, alt: 2.5 }; 
world.pointOfView(params);

// Scenes: 0:Intro -> 1:Spin -> 2:Profile -> 3:Dual -> 4:Skills -> 5:Certs -> 6:Contact
let currentScene = 0;
let isAnimating = false;

function updateView() {
    world.pointOfView({ lat: params.lat, lng: params.lng, altitude: params.alt });
    if(world.cloudMesh) world.cloudMesh.rotation.y += 0.001;
}

// --- SCENE 1: SPIN TO INDIA ---
function playScene1() {
    isAnimating = true;
    gsap.to("#screen-intro", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to(params, {
        lat: JAIPUR_LAT,
        lng: JAIPUR_LNG - 360, 
        duration: 3,
        ease: "power2.inOut",
        onUpdate: updateView,
        onComplete: () => {
            gsap.to("#screen-locked", { autoAlpha: 1, duration: 0.5 });
            isAnimating = false;
        }
    });
}

// --- SCENE 2: REVEAL DOSSIER ---
function playScene2() {
    isAnimating = true;
    gsap.to("#screen-locked", { autoAlpha: 0, duration: 0.5 });

    // Zoom Earth
    gsap.to(params, {
        alt: 0.1, lat: JAIPUR_LAT, lng: JAIPUR_LNG,
        duration: 2, ease: "power2.in", onUpdate: updateView
    });

    // Fade Earth, Show Dossier
    gsap.to("#earth-container", { opacity: 0, duration: 1, delay: 1.5 });
    
    gsap.to("#screen-profile", {
        autoAlpha: 1, 
        duration: 1, delay: 1.5,
        onStart: () => { document.querySelector('.cyber-tile').style.pointerEvents = 'auto'; },
        onComplete: () => { isAnimating = false; }
    });
}

// --- SCENE 3: DUAL CORE ---
function playScene3() {
    isAnimating = true;
    gsap.to("#screen-profile", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to("#screen-dual", {
        autoAlpha: 1, 
        duration: 1, delay: 0.5,
        onStart: () => { document.querySelector('.dual-container').style.pointerEvents = 'auto'; },
        onComplete: () => { isAnimating = false; }
    });
}

// --- SCENE 4: SKILLS ARSENAL ---
function playScene4() {
    isAnimating = true;
    gsap.to("#screen-dual", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to("#screen-skills", {
        autoAlpha: 1, 
        duration: 1, delay: 0.5,
        onComplete: () => { isAnimating = false; }
    });
}

// --- SCENE 5: CERTIFICATIONS ---
function playScene5() {
    isAnimating = true;
    gsap.to("#screen-skills", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to("#screen-certs", {
        autoAlpha: 1, 
        duration: 1, delay: 0.5,
        onComplete: () => { isAnimating = false; }
    });
}

// --- SCENE 6: CONTACT ---
function playScene6() {
    isAnimating = true;
    gsap.to("#screen-certs", { autoAlpha: 0, duration: 0.5 });
    
    gsap.to("#screen-contact", {
        autoAlpha: 1, 
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
        else if(currentScene === 4) { currentScene = 5; playScene5(); }
        else if(currentScene === 5) { currentScene = 6; playScene6(); }
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
        
        let dx = mouse.x - star.x;
        let dy = mouse.y - star.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 100) {
            star.x -= (dx/dist)*2;
            star.y -= (dy/dist)*2;
        }

        if(star.x < 0) star.x = width; if(star.x > width) star.x = 0;
        if(star.y < 0) star.y = height; if(star.y > height) star.y = 0;

        ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
        ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(animateStars);
}
initStars();
animateStars();