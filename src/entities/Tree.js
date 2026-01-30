import * as THREE from 'three';

export class Tree {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.mesh = null;
        this.isCut = false;
        this.interactionRange = 2.5;
        
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Trunk (cube) - doubled height from 2 to 4 units
        const trunkGeometry = new THREE.BoxGeometry(0.4, 4, 0.4);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, flatShading: true });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2; // Half of height (4/2)
        trunk.castShadow = true;
        group.add(trunk);
        
        // Foliage (multiple cubes arranged in layers for tree-like shape)
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22, flatShading: true });
        
        // Bottom foliage layer (largest)
        const foliageSize1 = 1.2;
        const foliage1 = new THREE.Mesh(new THREE.BoxGeometry(foliageSize1, foliageSize1, foliageSize1), foliageMaterial);
        foliage1.position.set(0, 4.5, 0);
        foliage1.castShadow = true;
        group.add(foliage1);
        
        // Middle foliage layers (slightly offset and smaller)
        const foliageSize2 = 1.0;
        const offsets = [
            { x: 0.3, z: 0.3 },
            { x: -0.3, z: 0.3 },
            { x: 0.3, z: -0.3 },
            { x: -0.3, z: -0.3 }
        ];
        
        offsets.forEach(offset => {
            const foliage2 = new THREE.Mesh(new THREE.BoxGeometry(foliageSize2, foliageSize2, foliageSize2), foliageMaterial);
            foliage2.position.set(offset.x, 5.2, offset.z);
            foliage2.castShadow = true;
            group.add(foliage2);
        });
        
        // Top foliage layer (smallest)
        const foliageSize3 = 0.8;
        const foliage3 = new THREE.Mesh(new THREE.BoxGeometry(foliageSize3, foliageSize3, foliageSize3), foliageMaterial);
        foliage3.position.set(0, 6.0, 0);
        foliage3.castShadow = true;
        group.add(foliage3);
        
        group.position.copy(this.position);
        this.mesh = group;
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getPosition() {
        return this.position;
    }
    
    isWithinRange(playerPosition) {
        const distance = this.position.distanceTo(playerPosition);
        return distance <= this.interactionRange;
    }
    
    cut() {
        if (!this.isCut) {
            this.isCut = true;
            return true;
        }
        return false;
    }
    
    remove() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}
