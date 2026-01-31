import * as THREE from 'three';
import { BaseModel } from './BaseModel.js';

export class CatDen extends BaseModel {
    constructor(x, z) {
        const position = new THREE.Vector3(x, 0, z);
        super(position, {
            placeholderColor: 0x8b7355, // Brown/tan color for cat den
            scale: 0.5
        });
        
        this.size = 1.5; // Collision radius
        this.isBuilt = false;
    }
    
    onModelLoadedInternal() {
        // Cat Den specific setup after model loads
        // Can add custom logic here if needed
    }
    
    getPosition() {
        return this.position;
    }
    
    getSize() {
        return this.size;
    }
    
    build() {
        this.isBuilt = true;
    }
    
    getIsBuilt() {
        return this.isBuilt;
    }
    
    // Override createPlaceholder to create a simple cube (50% larger)
    createPlaceholder() {
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.placeholderColor,
            flatShading: true
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = 0.75; // Center the cube on the ground (half of 1.5)
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
}
