import * as THREE from 'three';
import { MAP_CONFIG } from '../config/map.js';
import { VISUAL_CONFIG } from '../config/visual.js';

export class MapSystem {
    constructor(scene) {
        this.scene = scene;
        this.mapSize = MAP_CONFIG.mapSize;
        this.boundary = MAP_CONFIG.boundary;
        this.ground = null;
        this.extendedGround = null;
        this.boundaries = [];
        this.borderTerrain = [];
        this.terrainConfig = VISUAL_CONFIG.terrain;
        this.groundTextures = null;
        
        this.createGround();
        this.createBoundaries();
    }
    
    createGround() {
        const extendedSize = this.mapSize * 2;
        const { groundSegments, extendedSegments, extendedGroundOffset } = this.terrainConfig;
        const textures = this.createGroundTextures();
        
        // Create extended ground plane (240x240) - darker forest color
        const extendedGeometry = this.createTerrainGeometry(extendedSize, extendedSegments, 1.0);
        const extendedMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONFIG.dayExtendedGroundColor,
            map: textures.extended.colorMap,
            roughness: 0.95,
            metalness: 0.0,
            flatShading: true
        });
        this.extendedGround = new THREE.Mesh(extendedGeometry, extendedMaterial);
        this.extendedGround.position.y = extendedGroundOffset;
        this.extendedGround.receiveShadow = true;
        this.scene.add(this.extendedGround);
        
        // Create playable ground plane (120x120)
        const geometry = this.createTerrainGeometry(this.mapSize, groundSegments, 1.0);
        const material = new THREE.MeshStandardMaterial({
            color: VISUAL_CONFIG.dayGroundColor,
            map: textures.ground.colorMap,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true
        });
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }
    
    createBoundaries() {
        // Create simple boundary markers (corner posts)
        const boundaryHeight = MAP_CONFIG.boundaryHeight;
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
            const groundY = this.getHeightAt(pos[0], pos[1]);
            marker.position.set(pos[0], groundY + boundaryHeight / 2, pos[1]);
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

    createTerrainGeometry(size, segments, heightScale = 1.0) {
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        geometry.rotateX(-Math.PI / 2);
        
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const height = this.getHeightAt(x, z) * heightScale;
            positions.setY(i, height);
        }
        
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        return geometry;
    }

    createGroundTextures() {
        if (this.groundTextures) return this.groundTextures;
        
        const { textureWorldSize } = this.terrainConfig;
        const baseCanvases = this.generateTextureCanvases();
        const groundRepeat = this.mapSize / textureWorldSize;
        const extendedRepeat = (this.mapSize * 2) / textureWorldSize;
        
        this.groundTextures = {
            ground: this.buildTextureSet(baseCanvases, groundRepeat),
            extended: this.buildTextureSet(baseCanvases, extendedRepeat)
        };
        
        return this.groundTextures;
    }

    buildTextureSet(canvases, repeat) {
        const colorMap = new THREE.CanvasTexture(canvases.colorCanvas);
        colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
        colorMap.repeat.set(repeat, repeat);
        colorMap.colorSpace = THREE.SRGBColorSpace;
        colorMap.anisotropy = 4;

        return { colorMap };
    }

    generateTextureCanvases() {
        const {
            textureSize,
            textureCoarseScale,
            textureFineScale,
            texturePalette,
            seed
        } = this.terrainConfig;
        
        const palette = Array.isArray(texturePalette) && texturePalette.length > 0
            ? texturePalette
            : [0x3f6a45, 0x4b7a4d, 0x5a8b56];
        
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = textureSize;
        colorCanvas.height = textureSize;
        const colorCtx = colorCanvas.getContext('2d');
        const colorData = colorCtx.createImageData(textureSize, textureSize);
        
        const denom = textureSize - 1;
        const invDenom = denom > 0 ? 1 / denom : 0;
        for (let y = 0; y < textureSize; y++) {
            for (let x = 0; x < textureSize; x++) {
                const u = x * invDenom;
                const v = y * invDenom;
                
                const coarse = this.tileableNoise(u, v, textureCoarseScale, seed);
                const fine = this.tileableNoise(u, v, textureFineScale, seed + 11);
                const patch = this.tileableNoise(u, v, Math.max(2, Math.round(textureCoarseScale / 2)), seed + 29);
                
                let mix = coarse * 0.65 + fine * 0.25 - Math.max(0, patch) * 0.15;
                mix = this.clamp((mix + 1) * 0.5, 0, 0.999);
                let index = Math.floor(mix * palette.length);
                if (index >= palette.length) {
                    index = palette.length - 1;
                }
                
                const color = palette[index];
                const colorValueR = (color >> 16) & 0xff;
                const colorValueG = (color >> 8) & 0xff;
                const colorValueB = color & 0xff;
                const idx = (y * textureSize + x) * 4;
                colorData.data[idx] = colorValueR;
                colorData.data[idx + 1] = colorValueG;
                colorData.data[idx + 2] = colorValueB;
                colorData.data[idx + 3] = 255;
            }
        }
        
        colorCtx.putImageData(colorData, 0, 0);
        
        return { colorCanvas };
    }

    getHeightAt(x, z) {
        if (!this.terrainConfig) return 0;
        
        const {
            heightAmplitude,
            noiseScale,
            octaves,
            persistence,
            lacunarity,
            seed
        } = this.terrainConfig;
        
        let amplitude = 1;
        let frequency = 1;
        let total = 0;
        let max = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.valueNoise(
                x * noiseScale * frequency,
                z * noiseScale * frequency,
                seed + i * 17
            ) * amplitude;
            max += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        const normalized = max > 0 ? total / max : 0;
        let height = normalized * heightAmplitude;
        if (this.terrainConfig.heightSteps) {
            const steps = Math.max(2, this.terrainConfig.heightSteps);
            const step = heightAmplitude / steps;
            height = Math.round(height / step) * step;
        }
        return height;
    }

    valueNoise(x, z, seed) {
        const x0 = Math.floor(x);
        const z0 = Math.floor(z);
        const x1 = x0 + 1;
        const z1 = z0 + 1;
        
        const sx = this.smoothstep(x - x0);
        const sz = this.smoothstep(z - z0);
        
        const n00 = this.hash2D(x0, z0, seed);
        const n10 = this.hash2D(x1, z0, seed);
        const n01 = this.hash2D(x0, z1, seed);
        const n11 = this.hash2D(x1, z1, seed);
        
        const ix0 = THREE.MathUtils.lerp(n00, n10, sx);
        const ix1 = THREE.MathUtils.lerp(n01, n11, sx);
        return THREE.MathUtils.lerp(ix0, ix1, sz) * 2 - 1;
    }

    tileableNoise(u, v, period, seed) {
        const p = Math.max(1, Math.round(period));
        const x = u * p;
        const y = v * p;
        const x0 = Math.floor(x) % p;
        const y0 = Math.floor(y) % p;
        const x1 = (x0 + 1) % p;
        const y1 = (y0 + 1) % p;
        
        const sx = this.smoothstep(x - Math.floor(x));
        const sy = this.smoothstep(y - Math.floor(y));
        
        const n00 = this.hash2D(x0, y0, seed);
        const n10 = this.hash2D(x1, y0, seed);
        const n01 = this.hash2D(x0, y1, seed);
        const n11 = this.hash2D(x1, y1, seed);
        
        const ix0 = THREE.MathUtils.lerp(n00, n10, sx);
        const ix1 = THREE.MathUtils.lerp(n01, n11, sx);
        return THREE.MathUtils.lerp(ix0, ix1, sy) * 2 - 1;
    }

    hash2D(x, z, seed) {
        const s = Math.sin(x * 127.1 + z * 311.7 + seed * 0.1) * 43758.5453123;
        return s - Math.floor(s);
    }

    smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    updateGroundColors(nightMix) {
        if (!this.ground || !this.extendedGround) return;

        const dayGround = new THREE.Color(VISUAL_CONFIG.dayGroundColor);
        const nightGround = new THREE.Color(VISUAL_CONFIG.nightGroundColor);
        const dayExtended = new THREE.Color(VISUAL_CONFIG.dayExtendedGroundColor);
        const nightExtended = new THREE.Color(VISUAL_CONFIG.nightExtendedGroundColor);

        const groundColor = dayGround.lerp(nightGround, nightMix);
        const extendedColor = dayExtended.lerp(nightExtended, nightMix);

        this.ground.material.color.copy(groundColor);
        this.extendedGround.material.color.copy(extendedColor);
    }
}
