import * as THREE from 'three';

export class GhostPreview {
    constructor(buildItem) {
        this.buildItem = buildItem;
        this.mesh = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.isValid = false;
        
        this.createMesh();
    }
    
    createMesh() {
        // Create a semi-transparent cube preview (50% larger to match CatDen)
        const group = new THREE.Group();
        const buildSize = (this.buildItem?.size ?? 1.5) * 2;
        
        // Main cube (ghost version)
        const cubeGeometry = new THREE.BoxGeometry(buildSize, buildSize, buildSize);
        const cubeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            flatShading: true,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.y = buildSize * 0.5;
        group.add(cube);
        
        // Outline wireframe for better visibility
        const outlineGeometry = new THREE.BoxGeometry(buildSize * 1.03, buildSize * 1.03, buildSize * 1.03);
        const outlineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outline.position.y = buildSize * 0.5;
        group.add(outline);
        
        this.outlineMesh = outline;
        
        group.position.copy(this.position);
        this.mesh = group;
        
        this.updateValidity(false);
    }
    
    setPosition(x, z) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = 0;
        
        if (this.mesh) {
            this.mesh.position.x = x;
            this.mesh.position.z = z;
            this.mesh.position.y = 0;
        }
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    updateValidity(isValid) {
        this.isValid = isValid;
        
        if (!this.mesh) return;
        
        const color = isValid ? 0x00ff00 : 0xff0000; // Green or red
        const opacity = isValid ? 0.5 : 0.3;
        
        // Update all materials
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((material) => {
                    if (material && !material.wireframe) {
                        material.color.setHex(color);
                        material.opacity = opacity;
                    }
                });
            }
        });
        
        // Update outline color
        if (this.outlineMesh && this.outlineMesh.material) {
            this.outlineMesh.material.color.setHex(color);
        }
    }
    
    getMesh() {
        return this.mesh;
    }
    
    remove() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}
