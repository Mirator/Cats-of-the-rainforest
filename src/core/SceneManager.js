import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual.js';

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
        this.cameraOffset = new THREE.Vector3(
            VISUAL_CONFIG.cameraOffset.x,
            VISUAL_CONFIG.cameraOffset.y,
            VISUAL_CONFIG.cameraOffset.z
        );
        this.camera.position.set(
            VISUAL_CONFIG.cameraOffset.x,
            VISUAL_CONFIG.cameraOffset.y,
            VISUAL_CONFIG.cameraOffset.z
        );
        this.camera.lookAt(0, 0, 0);
        
        // Lighting - store references for day/night changes
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);
        
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(10, 20, 10);
        this.directionalLight.castShadow = true;
        this.scene.add(this.directionalLight);
        
        // Add fog for atmospheric effect (terrain-matching green)
        this.scene.fog = new THREE.Fog(
            VISUAL_CONFIG.dayFogColor,
            VISUAL_CONFIG.dayFogNear,
            VISUAL_CONFIG.dayFogFar
        );
        
        // Set initial day background (forest green instead of blue sky)
        this.scene.background = new THREE.Color(VISUAL_CONFIG.dayBackground);
        
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
    
    updateCamera(targetPosition, mapSystem) {
        if (!targetPosition) return;
        
        // Calculate camera position relative to player
        const cameraPos = new THREE.Vector3();
        cameraPos.copy(targetPosition);
        cameraPos.add(this.cameraOffset);
        
        // Calculate slowdown factor based on distance to boundary
        let slowdownFactor = 1.0;
        if (mapSystem) {
            const boundary = mapSystem.getBoundary();
            const slowdownZone = VISUAL_CONFIG.cameraSlowdownZone;
            
            // Calculate distance from center
            const distanceFromCenter = Math.sqrt(
                targetPosition.x * targetPosition.x + 
                targetPosition.z * targetPosition.z
            );
            
            // Calculate distance to boundary
            const distanceToBoundary = boundary - distanceFromCenter;
            
            // Calculate slowdown factor
            if (distanceToBoundary <= 0) {
                // At or beyond boundary - camera stops
                slowdownFactor = 0.0;
            } else if (distanceToBoundary < slowdownZone) {
                // Within slowdown zone - gradual slowdown
                slowdownFactor = distanceToBoundary / slowdownZone;
            } else {
                // Far from boundary - full speed
                slowdownFactor = 1.0;
            }
        }
        
        // Apply slowdown factor to lerp speed
        const baseLerpSpeed = VISUAL_CONFIG.cameraBaseLerpSpeed;
        const lerpSpeed = baseLerpSpeed * slowdownFactor;
        
        // Smoothly move camera to follow player (with slowdown near boundaries)
        this.camera.position.lerp(cameraPos, lerpSpeed);
        
        // Camera rotation is fixed - do not rotate to look at player
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
            // Day settings: bright and clear (terrain-matching green)
            this.ambientLight.intensity = VISUAL_CONFIG.dayAmbientIntensity;
            this.directionalLight.intensity = VISUAL_CONFIG.dayDirectionalIntensity;
            this.scene.background = new THREE.Color(VISUAL_CONFIG.dayBackground);
            this.scene.fog.color.setHex(VISUAL_CONFIG.dayFogColor);
            this.scene.fog.near = VISUAL_CONFIG.dayFogNear;
            this.scene.fog.far = VISUAL_CONFIG.dayFogFar;
        } else if (state === 'night') {
            // Night settings: dark and atmospheric (dark forest green, no blue - minimum 0x20 per channel)
            this.ambientLight.intensity = VISUAL_CONFIG.nightAmbientIntensity;
            this.directionalLight.intensity = VISUAL_CONFIG.nightDirectionalIntensity;
            this.scene.background = new THREE.Color(VISUAL_CONFIG.nightBackground);
            this.scene.fog.color.setHex(VISUAL_CONFIG.nightFogColor);
            this.scene.fog.near = VISUAL_CONFIG.nightFogNear;
            this.scene.fog.far = VISUAL_CONFIG.nightFogFar;
        }
    }
}
