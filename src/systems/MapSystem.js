import * as THREE from 'three';

export class MapSystem {
    constructor(scene) {
        this.scene = scene;
        this.mapSize = 120;
        this.boundary = this.mapSize / 2;
        this.ground = null;
        this.extendedGround = null;
        this.boundaries = [];
        this.borderTerrain = [];
        
        this.createGround();
        this.createBoundaries();
    }
    
    createGround() {
        // Create extended ground plane (240x240) - darker forest color
        const extendedSize = this.mapSize * 2;
        const extendedGeometry = new THREE.PlaneGeometry(extendedSize, extendedSize);
        const extendedMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a5c49, // Darker forest green
            roughness: 0.8,
            flatShading: true
        });
        this.extendedGround = new THREE.Mesh(extendedGeometry, extendedMaterial);
        this.extendedGround.rotation.x = -Math.PI / 2;
        this.extendedGround.position.y = -0.01; // Slightly below playable ground
        this.extendedGround.receiveShadow = true;
        this.scene.add(this.extendedGround);
        
        // Create playable ground plane (120x120) - current green color
        const geometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x4a7c59,
            roughness: 0.8,
            flatShading: true
        });
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }
    
    createBoundaries() {
        // Create simple boundary markers (corner posts)
        const boundaryHeight = 2;
        const boundaryGeometry = new THREE.BoxGeometry(0.5, boundaryHeight, 0.5);
        const boundaryMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, flatShading: true });
        
        const positions = [
            [-this.boundary, 0, -this.boundary],
            [this.boundary, 0, -this.boundary],
            [-this.boundary, 0, this.boundary],
            [this.boundary, 0, this.boundary]
        ];
        
        positions.forEach(pos => {
            const marker = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
            marker.position.set(pos[0], boundaryHeight / 2, pos[1]);
            this.boundaries.push(marker);
            this.scene.add(marker);
        });
    }
    
    getMapSize() {
        return this.mapSize;
    }
    
    getBoundary() {
        return this.boundary;
    }
    
    isWithinBounds(x, z) {
        return Math.abs(x) < this.boundary && Math.abs(z) < this.boundary;
    }
    
    clampPosition(x, z) {
        const clampedX = Math.max(-this.boundary, Math.min(this.boundary, x));
        const clampedZ = Math.max(-this.boundary, Math.min(this.boundary, z));
        return { x: clampedX, z: clampedZ };
    }
    
    getCenter() {
        return { x: 0, y: 0, z: 0 };
    }
}
