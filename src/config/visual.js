// Visual constants
export const VISUAL_CONFIG = {
    // Model scales
    playerScale: 0.5,
    catScale: 0.5,
    mouseScale: 0.5,
    treeScale: 0.5,
    totemScale: 1.0,
    catDenScale: 1.0,
    towerScale: 0.75,
    
    // Y offsets
    defaultYOffset: 0.5,
    
    // Placeholder colors
    playerPlaceholderColor: 0xff8c42,
    catPlaceholderColor: 0xff8c42,
    mousePlaceholderColor: 0x8b7355,
    treePlaceholderColor: 0x228b22,
    towerPlaceholderColor: 0x6a5a4a,
    catDenPlaceholderColor: 0x8b7355,
    totemPlaceholderColor: 0x5a4a3a,
    
    // Camera settings
    cameraOffset: { x: 0, y: 9, z: 9 },
    cameraSlowdownZone: 22.5, // Start slowing down 22.5 units before boundary
    cameraBaseLerpSpeed: 0.1,
    
    // Scene colors
    dayBackground: 0x7fa88d,
    nightBackground: 0x5f7867,
    dayFogColor: 0x7fa88d,
    nightFogColor: 0x5f7867,
    dayFogNear: 37.5,
    dayFogFar: 150,
    nightFogNear: 30.0,
    nightFogFar: 135.0,
    dayGroundColor: 0x6cab82,
    nightGroundColor: 0x567368,
    dayExtendedGroundColor: 0x5a8c6f,
    nightExtendedGroundColor: 0x4f6a60,

    // Terrain + procedural ground textures
    terrain: {
        heightAmplitude: 4.2,
        noiseScale: 0.035,
        octaves: 2,
        persistence: 0.4,
        lacunarity: 1.8,
        seed: 1337,
        groundSegments: 48,
        extendedSegments: 32,
        extendedGroundOffset: -0.12,
        heightSteps: 4,
        textureSize: 64,
        textureWorldSize: 14,
        textureCoarseScale: 3,
        textureFineScale: 8,
        texturePalette: [0x6cab82]
    },
    
    // Lighting
    dayAmbientIntensity: 0.85,
    dayDirectionalIntensity: 1.05,
    nightAmbientIntensity: 0.7,
    nightDirectionalIntensity: 0.85,
    
    // Day/Night transitions
    transitionDuration: 2.0, // seconds for smooth day/night transitions
    
    // Screenshot system
    screenshot: {
        cameraTransitionDuration: 2.0, // seconds to transition camera to map view
        captureDelay: 5.0, // seconds to wait after camera transition before capture
        mapPadding: 1.1 // extra padding to guarantee full playable map in frame
    },
    
    // Visual feedback effects
    effects: {
        treeCutDuration: 1.0, // seconds
        treeCutParticleCount: 8,
        treeCutColor: 0x228b22, // Green particles
        
        catSpawnDuration: 1.5, // seconds
        catSpawnParticleCount: 12,
        catSpawnColor: 0xff8c42, // Orange particles
        
        buildingCompleteDuration: 1.5, // seconds
        buildingCompleteParticleCount: 15,
        buildingCompleteColor: 0xffd700, // Gold particles
        
        enemyDeathDuration: 0.8, // seconds
        enemyDeathParticleCount: 10,
        enemyDeathColor: 0x8b7355 // Brown particles
    }
};
