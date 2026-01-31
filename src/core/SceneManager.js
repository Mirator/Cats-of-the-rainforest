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
        
        // Day/night transition state
        this.currentVisualState = 'day'; // 'day', 'night', or 'transitioning'
        this.targetVisualState = 'day';
        this.transitionProgress = 0; // 0 to 1
        this.transitionStartTime = 0;
        this.isTransitioning = false;
        
        // Current visual values (for smooth transitions)
        this.currentAmbientIntensity = VISUAL_CONFIG.dayAmbientIntensity;
        this.currentDirectionalIntensity = VISUAL_CONFIG.dayDirectionalIntensity;
        this.currentBackgroundColor = new THREE.Color(VISUAL_CONFIG.dayBackground);
        this.currentFogColor = new THREE.Color(VISUAL_CONFIG.dayFogColor);
        this.currentFogNear = VISUAL_CONFIG.dayFogNear;
        this.currentFogFar = VISUAL_CONFIG.dayFogFar;
        
        // Visual effects
        this.activeEffects = [];
        
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
    
    update(deltaTime) {
        // Update visual effects
        this.updateEffects(deltaTime);
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
        // If already in this state, do nothing
        if (this.currentVisualState === state && !this.isTransitioning) {
            return;
        }
        
        // Start transition
        this.targetVisualState = state;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionStartTime = performance.now();
    }
    
    updateDayNightTransition(deltaTime, mapSystem = null) {
        if (!this.isTransitioning) {
            return;
        }
        
        // Update transition progress
        const elapsed = (performance.now() - this.transitionStartTime) / 1000; // Convert to seconds
        const duration = VISUAL_CONFIG.transitionDuration;
        this.transitionProgress = Math.min(elapsed / duration, 1);
        
        // Ease in-out for smoother transition
        const eased = this.transitionProgress < 0.5
            ? 2 * this.transitionProgress * this.transitionProgress
            : 1 - Math.pow(-2 * this.transitionProgress + 2, 2) / 2;
        
        // Get target values
        const targetAmbient = this.targetVisualState === 'day' 
            ? VISUAL_CONFIG.dayAmbientIntensity 
            : VISUAL_CONFIG.nightAmbientIntensity;
        const targetDirectional = this.targetVisualState === 'day'
            ? VISUAL_CONFIG.dayDirectionalIntensity
            : VISUAL_CONFIG.nightDirectionalIntensity;
        const targetBackground = this.targetVisualState === 'day'
            ? VISUAL_CONFIG.dayBackground
            : VISUAL_CONFIG.nightBackground;
        const targetFogColor = this.targetVisualState === 'day'
            ? VISUAL_CONFIG.dayFogColor
            : VISUAL_CONFIG.nightFogColor;
        const targetFogNear = this.targetVisualState === 'day'
            ? VISUAL_CONFIG.dayFogNear
            : VISUAL_CONFIG.nightFogNear;
        const targetFogFar = this.targetVisualState === 'day'
            ? VISUAL_CONFIG.dayFogFar
            : VISUAL_CONFIG.nightFogFar;
        
        // Interpolate values
        this.currentAmbientIntensity = THREE.MathUtils.lerp(
            this.currentAmbientIntensity,
            targetAmbient,
            eased
        );
        this.currentDirectionalIntensity = THREE.MathUtils.lerp(
            this.currentDirectionalIntensity,
            targetDirectional,
            eased
        );
        
        // Interpolate colors
        const targetBgColor = new THREE.Color(targetBackground);
        this.currentBackgroundColor.lerp(targetBgColor, eased);
        
        const targetFogCol = new THREE.Color(targetFogColor);
        this.currentFogColor.lerp(targetFogCol, eased);
        
        // Interpolate fog distances
        this.currentFogNear = THREE.MathUtils.lerp(
            this.currentFogNear,
            targetFogNear,
            eased
        );
        this.currentFogFar = THREE.MathUtils.lerp(
            this.currentFogFar,
            targetFogFar,
            eased
        );
        
        // Apply interpolated values
        this.ambientLight.intensity = this.currentAmbientIntensity;
        this.directionalLight.intensity = this.currentDirectionalIntensity;
        this.scene.background = this.currentBackgroundColor.clone();
        this.scene.fog.color.copy(this.currentFogColor);
        this.scene.fog.near = this.currentFogNear;
        this.scene.fog.far = this.currentFogFar;

        if (mapSystem && typeof mapSystem.updateGroundColors === 'function') {
            const nightMix = this.targetVisualState === 'night' ? eased : 1 - eased;
            mapSystem.updateGroundColors(nightMix);
        }
        
        // Check if transition is complete
        if (this.transitionProgress >= 1) {
            this.isTransitioning = false;
            this.currentVisualState = this.targetVisualState;
            
            // Ensure final values are exact
            this.ambientLight.intensity = targetAmbient;
            this.directionalLight.intensity = targetDirectional;
            this.scene.background = new THREE.Color(targetBackground);
            this.scene.fog.color.setHex(targetFogColor);
            this.scene.fog.near = targetFogNear;
            this.scene.fog.far = targetFogFar;

            if (mapSystem && typeof mapSystem.updateGroundColors === 'function') {
                const nightMix = this.currentVisualState === 'night' ? 1 : 0;
                mapSystem.updateGroundColors(nightMix);
            }
            
            // Update current values to match
            this.currentAmbientIntensity = targetAmbient;
            this.currentDirectionalIntensity = targetDirectional;
            this.currentBackgroundColor.setHex(targetBackground);
            this.currentFogColor.setHex(targetFogColor);
            this.currentFogNear = targetFogNear;
            this.currentFogFar = targetFogFar;
        }
    }
    
    /**
     * Frame the entire map for screenshot capture
     * @param {MapSystem} mapSystem - The map system to get boundary from
     * @param {Function} onComplete - Callback when camera transition is complete
     */
    frameMapForScreenshot(mapSystem, onComplete) {
        if (!mapSystem) {
            if (onComplete) onComplete();
            return;
        }
        
        const boundary = mapSystem.getBoundary();
        const mapSize = mapSystem.getMapSize() || boundary * 2;
        
        // Calculate camera position to frame entire map
        // Use orthographic-like positioning: camera high above center, looking down
        // Calculate distance needed to see entire map with current FOV
        const fov = this.camera.fov * (Math.PI / 180);
        const aspect = this.camera.aspect;
        const mapDiagonal = Math.sqrt((boundary * 2) ** 2 + (boundary * 2) ** 2);
        
        // Calculate height needed to see entire map
        // tan(fov/2) = (mapDiagonal/2) / height
        const height = (mapDiagonal / 2) / Math.tan(fov / 2);
        // Add some padding
        const cameraHeight = height * 1.2;
        
        // Target position: center of map, high above
        const targetPosition = new THREE.Vector3(0, cameraHeight, 0);
        
        // Store original camera position for potential restoration
        this.originalCameraPosition = this.camera.position.clone();
        this.originalCameraLookAt = new THREE.Vector3(0, 0, 0);
        
        // Animate camera to target position
        const startPosition = this.camera.position.clone();
        const startTime = performance.now();
        const duration = VISUAL_CONFIG.screenshot.cameraTransitionDuration * 1000; // Convert to ms
        
        const animate = () => {
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease in-out
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Interpolate position
            this.camera.position.lerpVectors(startPosition, targetPosition, eased);
            this.camera.lookAt(0, 0, 0);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Camera transition complete
                if (onComplete) {
                    setTimeout(onComplete, VISUAL_CONFIG.screenshot.captureDelay * 1000);
                }
            }
        };
        
        animate();
    }
    
    /**
     * Capture screenshot of current render
     * @returns {string} Data URL of the screenshot
     */
    captureScreenshot() {
        // Render one frame to ensure everything is up to date
        this.render();
        
        // Capture screenshot
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        return dataURL;
    }
    
    /**
     * Restore camera to original position (after screenshot)
     */
    restoreCamera() {
        if (this.originalCameraPosition) {
            this.camera.position.copy(this.originalCameraPosition);
            this.originalCameraPosition = null;
        }
    }
    
    /**
     * Create a particle effect at a position
     * @param {THREE.Vector3} position - World position
     * @param {string} effectType - 'treeCut', 'catSpawn', 'buildingComplete', 'enemyDeath'
     */
    createParticleEffect(position, effectType) {
        const effectConfig = VISUAL_CONFIG.effects;
        let config;
        
        switch (effectType) {
            case 'treeCut':
                config = {
                    duration: effectConfig.treeCutDuration,
                    particleCount: effectConfig.treeCutParticleCount,
                    color: effectConfig.treeCutColor
                };
                break;
            case 'catSpawn':
                config = {
                    duration: effectConfig.catSpawnDuration,
                    particleCount: effectConfig.catSpawnParticleCount,
                    color: effectConfig.catSpawnColor
                };
                break;
            case 'buildingComplete':
                config = {
                    duration: effectConfig.buildingCompleteDuration,
                    particleCount: effectConfig.buildingCompleteParticleCount,
                    color: effectConfig.buildingCompleteColor
                };
                break;
            case 'enemyDeath':
                config = {
                    duration: effectConfig.enemyDeathDuration,
                    particleCount: effectConfig.enemyDeathParticleCount,
                    color: effectConfig.enemyDeathColor
                };
                break;
            default:
                return;
        }
        
        // Create particle group
        const particles = new THREE.Group();
        particles.position.copy(position);
        particles.position.y += 0.5; // Slightly above ground
        
        // Create individual particles
        for (let i = 0; i < config.particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: config.color });
            const particle = new THREE.Mesh(geometry, material);
            
            // Random direction
            const angle = (Math.PI * 2 * i) / config.particleCount + Math.random() * 0.5;
            const speed = 0.5 + Math.random() * 0.5;
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    1 + Math.random() * 1,
                    Math.sin(angle) * speed
                ),
                startTime: performance.now()
            };
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Store effect for update
        this.activeEffects.push({
            group: particles,
            duration: config.duration,
            startTime: performance.now()
        });
    }

    /**
     * Create a slash effect in front of the player to visualize attack arc/range.
     * @param {THREE.Vector3} position - World position
     * @param {number} rotationY - Player facing rotation
     * @param {number} range - Attack range
     * @param {number} arc - Attack arc (radians)
     */
    createSlashEffect(position, rotationY, range, arc) {
        const group = new THREE.Group();
        group.position.copy(position);

        const ringGeometry = new THREE.RingGeometry(range * 0.82, range, 32, 1, -arc / 2, arc);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xf2f2f2,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.rotation.y = rotationY + Math.PI / 2;
        ring.position.y = 0.03;
        group.add(ring);

        const slashGroup = new THREE.Group();
        const slashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const slashGeometry = new THREE.PlaneGeometry(0.08, Math.min(1.2, range * 0.8));

        const slashOffsets = [-0.25, 0, 0.25];
        for (const offset of slashOffsets) {
            const slash = new THREE.Mesh(slashGeometry, slashMaterial.clone());
            slash.position.set(0, 0.9, Math.min(1.2, range * 0.6));
            slash.rotation.z = Math.PI / 4;
            slash.rotation.y = offset;
            slashGroup.add(slash);
        }

        slashGroup.rotation.y = rotationY;
        group.add(slashGroup);

        this.scene.add(group);

        this.activeEffects.push({
            group,
            duration: 0.15,
            startTime: performance.now(),
            update: (effect, deltaTime, progress) => {
                const scale = 0.9 + progress * 0.25;
                effect.group.scale.set(scale, scale, scale);
                effect.group.traverse((child) => {
                    if (child.material) {
                        child.material.opacity = Math.max(0, 1 - progress);
                        child.material.transparent = true;
                    }
                });
            }
        });
    }
    
    /**
     * Update all active visual effects
     * @param {number} deltaTime - Time since last frame
     */
    updateEffects(deltaTime) {
        const currentTime = performance.now();
        
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            const elapsed = (currentTime - effect.startTime) / 1000;
            const progress = elapsed / effect.duration;
            
            if (progress >= 1) {
                // Effect complete - remove
                this.scene.remove(effect.group);
                effect.group.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.activeEffects.splice(i, 1);
                continue;
            }

            if (typeof effect.update === 'function') {
                effect.update(effect, deltaTime, progress);
                continue;
            }
            
            // Update particles
            const fadeProgress = 1 - progress;
            effect.group.children.forEach((particle, index) => {
                if (particle.userData.velocity) {
                    // Move particle
                    particle.position.add(
                        particle.userData.velocity.clone().multiplyScalar(deltaTime)
                    );
                    
                    // Apply gravity
                    particle.userData.velocity.y -= 5 * deltaTime;
                    
                    // Fade out
                    if (particle.material) {
                        particle.material.opacity = fadeProgress;
                        particle.material.transparent = true;
                    }
                }
            });
        }
    }
}
