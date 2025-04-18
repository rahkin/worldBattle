export const POWER_UP_TYPES = {
    SPEED: 'speed',
    DAMAGE: 'damage',
    DEFENSE: 'defense',
    AMMO: 'ammo'
};

export const POWER_UP_EFFECTS = {
    [POWER_UP_TYPES.SPEED]: {
        speedBoost: 1.5,
        damageBoost: 1.0,
        defenseBoost: 1.0,
        ammoRegen: 0
    },
    [POWER_UP_TYPES.DAMAGE]: {
        speedBoost: 1.0,
        damageBoost: 2.0,
        defenseBoost: 1.0,
        ammoRegen: 0
    },
    [POWER_UP_TYPES.DEFENSE]: {
        speedBoost: 1.0,
        damageBoost: 1.0,
        defenseBoost: 2.0,
        ammoRegen: 0
    },
    [POWER_UP_TYPES.AMMO]: {
        speedBoost: 1.0,
        damageBoost: 1.0,
        defenseBoost: 1.0,
        ammoRegen: 5
    }
}; 