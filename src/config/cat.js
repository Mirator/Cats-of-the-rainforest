// Cat-specific configuration
export const CAT_CONFIG = {
    speed: 4.0,
    collisionRadius: 0.6,
    
    // Roaming behavior
    wanderInterval: {
        min: 2.0,
        max: 5.0
    },
    dayTotemBiasChance: 0.65,
    dayTotemBiasRadius: {
        min: 2.5,
        max: 8.0
    },
    nightTotemRadius: {
        min: 1.5,
        max: 4.5
    },
    
    // Animation speeds (same as player)
    legSpeed: 1.4,
    legAmplitude: 12.5 * (Math.PI / 180),
    headSpeed: 1.5,
    headAmplitude: 2.5 * (Math.PI / 180),
    headBobAmplitude: 0.03,
    tailSpeed: 1.0,
    idleAmplitude: 3 * (Math.PI / 180),
    runningAmplitude: 6 * (Math.PI / 180),
    
    // Color variation
    colorVariationAmount: 0.12,
    
    // Body color palette (cat-friendly colors)
    bodyColorPalette: [
        // Orange/Ginger tones
        0xff8c42, 0xff6b35, 0xffa500, 0xffb347, 0xffcc99, 0xffd700,
        // Brown/Tabby tones
        0xcd853f, 0xd2691e, 0xdaa520, 0xdeb887, 0xf4a460, 0xe6b887,
        // Gray tones
        0xd3d3d3, 0xc0c0c0, 0xa9a9a9, 0xbcbcbc, 0xdcdcdc, 0xe0e0e0,
        // Cream/Beige tones
        0xfff8dc, 0xfffdd0, 0xf5deb3, 0xfaf0e6, 0xfffef0, 0xfff8e7,
        // Calico/Tortoiseshell patterns
        0xff6b6b, 0xffa07a, 0xffb6c1, 0xffc0cb, 0xffdab9, 0xffe4b5,
        // Light pastels
        0xffe4e1, 0xfff0f5, 0xf0e68c, 0xfffacd, 0xfff5ee, 0xfdf5e6,
        // Sandy/Tan tones
        0xf5deb3, 0xe6d3a3, 0xd2b48c, 0xc9a961, 0xd4af37, 0xe6c200,
        // Light peach/apricot
        0xffdab9, 0xffcccb, 0xffb6c1, 0xffa07a, 0xff8c69, 0xff7f50
    ],
    
    // Mask color palette
    maskColorPalette: [
        // Medium blues and teals
        0x4682b4, 0x5f9ea0, 0x40e0d0, 0x00ced1, 0x87ceeb, 0x6495ed,
        // Rich reds and pinks
        0xdc143c, 0xff1493, 0xff6347, 0xff69b4, 0xff7f50, 0xcd5c5c,
        // Purples and violets
        0x9370db, 0xba55d3, 0xda70d6, 0x8a2be2, 0x9b59b6, 0x7b68ee,
        // Earth tones
        0x8b7355, 0xa0826d, 0xb8860b, 0xcd853f, 0xdaa520, 0xd2691e,
        // Greens
        0x6b8e23, 0x9acd32, 0x7cfc00, 0x32cd32, 0x3cb371, 0x66cdaa,
        // Oranges and corals
        0xff8c00, 0xff7f50, 0xff6347, 0xff4500, 0xff6b47, 0xff8c69,
        // Yellows and golds
        0xffd700, 0xffa500, 0xffb347, 0xdaa520, 0xb8860b, 0xd4af37
    ]
};
