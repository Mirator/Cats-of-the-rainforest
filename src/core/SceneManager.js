import * as THREE from 'three';

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }
    
    init() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Create camera (positioned for 2.5D view)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        // Camera offset from player (closer for better zoom)
        this.cameraOffset = new THREE.Vector3(0, 12, 12);
        this.camera.position.set(0, 12, 12);
        this.camera.lookAt(0, 0, 0);
        
        // Lighting - store references for day/night changes
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);
        
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(10, 20, 10);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);
        
        // Add fog for atmospheric effect
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Set initial day background
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Update mouse position for raycaster
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updateCamera(targetPosition) {
        if (!targetPosition) return;
        
        // Calculate camera position relative to player
        const cameraPos = new THREE.Vector3();
        cameraPos.copy(targetPosition);
        cameraPos.add(this.cameraOffset);
        
        // Smoothly move camera to follow player
        this.camera.position.lerp(cameraPos, 0.1);
        
        // Make camera look at player position
        this.camera.lookAt(targetPosition);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    getRaycaster() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        return this.raycaster;
    }
    
    add(object) {
        this.scene.add(object);
    }
    
    remove(object) {
        this.scene.remove(object);
    }
    
    updateDayNightVisuals(state) {
        if (state === 'day') {
            // Day settings: bright and clear
            this.ambientLight.intensity = 0.6;
            this.directionalLight.intensity = 0.8;
            this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
            this.scene.fog.color.setHex(0x87CEEB); // Light fog
            this.scene.fog.near = 50;
            this.scene.fog.far = 200;
        } else if (state === 'night') {
            // Night settings: dark and atmospheric (no black - minimum 0x20 per channel)
            this.ambientLight.intensity = 0.2;
            this.directionalLight.intensity = 0.3;
            this.scene.background = new THREE.Color(0x2a2a4e); // Dark blue/purple (not black)
            this.scene.fog.color.setHex(0x2a2a4e); // Darker fog
            this.scene.fog.near = 30;
            this.scene.fog.far = 150;
        }
    }
}
