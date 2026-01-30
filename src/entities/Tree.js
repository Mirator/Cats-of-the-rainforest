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
        
        // Trunk (cylinder)
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Foliage (sphere)
        const foliageGeometry = new THREE.SphereGeometry(1.2, 8, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2.5;
        foliage.castShadow = true;
        group.add(foliage);
        
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
