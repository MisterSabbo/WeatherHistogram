export const SKIN_TYPES = [
    { id: 1, labelKey: 'skinType1', uvThreshold: 1 },
    { id: 2, labelKey: 'skinType2', uvThreshold: 2 },
    { id: 3, labelKey: 'skinType3', uvThreshold: 3 },
    { id: 4, labelKey: 'skinType4', uvThreshold: 4 },
    { id: 5, labelKey: 'skinType5', uvThreshold: 5 },
    { id: 6, labelKey: 'skinType6', uvThreshold: 6 }
];

export const DEFAULT_SKIN_TYPE = 2;

export function getSkinType(id) {
    return SKIN_TYPES.find(s => s.id === id) || SKIN_TYPES[1];
}

export function needsSunProtection(skinType, uvIndex) {
    const skin = getSkinType(skinType);
    return uvIndex > 0 && skin && skin.uvThreshold <= uvIndex;
}
