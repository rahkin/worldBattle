export const mapboxConfig = {
    // Mapbox API settings
    api: {
        token: process.env.MAPBOX_TOKEN || '',
        style: 'mapbox://styles/mapbox/streets-v11',
        zoom: 15,
        center: {
            longitude: -74.006, // Default to New York City
            latitude: 40.7128
        }
    },

    // Building type definitions
    buildingTypes: {
        residential: {
            name: 'Residential',
            footprint: {
                defaultHeight: 10,
                roofType: 'flat',
                minHeight: 5,
                maxHeight: 30,
                wallThickness: 0.3
            },
            material: {
                color: 0xcccccc,
                roughness: 0.7,
                metalness: 0.1,
                weathering: 0.2,
                windowColor: 0x88ccff,
                windowOpacity: 0.8
            },
            properties: {
                health: 100,
                maxWorkers: 0,
                population: 10,
                resourceStorage: 100
            }
        },
        commercial: {
            name: 'Commercial',
            footprint: {
                defaultHeight: 15,
                roofType: 'flat',
                minHeight: 8,
                maxHeight: 40,
                wallThickness: 0.4
            },
            material: {
                color: 0x999999,
                roughness: 0.6,
                metalness: 0.2,
                weathering: 0.1,
                windowColor: 0xffffff,
                windowOpacity: 0.9
            },
            properties: {
                health: 120,
                maxWorkers: 5,
                population: 0,
                resourceStorage: 200
            }
        },
        industrial: {
            name: 'Industrial',
            footprint: {
                defaultHeight: 20,
                roofType: 'flat',
                minHeight: 10,
                maxHeight: 50,
                wallThickness: 0.5
            },
            material: {
                color: 0x666666,
                roughness: 0.8,
                metalness: 0.3,
                weathering: 0.3,
                windowColor: 0xaaaaaa,
                windowOpacity: 0.7
            },
            properties: {
                health: 150,
                maxWorkers: 10,
                population: 0,
                resourceStorage: 500
            }
        }
    },

    // Building feature mapping
    featureMapping: {
        // Mapbox building types to our building types
        buildingTypes: {
            'apartments': 'residential',
            'house': 'residential',
            'residential': 'residential',
            'commercial': 'commercial',
            'retail': 'commercial',
            'office': 'commercial',
            'industrial': 'industrial',
            'warehouse': 'industrial',
            'factory': 'industrial'
        },

        // Mapbox materials to our materials
        materials: {
            'brick': {
                color: 0xcc6666,
                roughness: 0.8,
                metalness: 0.1
            },
            'concrete': {
                color: 0xcccccc,
                roughness: 0.7,
                metalness: 0.2
            },
            'glass': {
                color: 0x88ccff,
                roughness: 0.1,
                metalness: 0.8,
                transparent: true,
                opacity: 0.8
            },
            'metal': {
                color: 0x999999,
                roughness: 0.4,
                metalness: 0.9
            }
        }
    },

    // Import settings
    import: {
        batchSize: 50, // Number of buildings to import at once
        maxRetries: 3, // Maximum number of retries for failed imports
        retryDelay: 1000, // Delay between retries in milliseconds
        coordinatePrecision: 6, // Number of decimal places for coordinates
        minBuildingArea: 10, // Minimum building area in square meters
        maxBuildingArea: 10000 // Maximum building area in square meters
    },

    // Resource production rates by building type
    resourceProduction: {
        residential: {
            population: 1, // Population per unit
            food: 0.1, // Food production per worker
            happiness: 0.5 // Happiness production per worker
        },
        commercial: {
            money: 2, // Money production per worker
            goods: 1, // Goods production per worker
            happiness: 0.3 // Happiness production per worker
        },
        industrial: {
            goods: 3, // Goods production per worker
            pollution: 0.5, // Pollution production per worker
            money: 1 // Money production per worker
        }
    },

    // Building upgrade paths
    upgrades: {
        residential: {
            level2: {
                cost: 1000,
                effects: {
                    population: 1.5,
                    health: 1.2,
                    happiness: 1.3
                }
            },
            level3: {
                cost: 2500,
                effects: {
                    population: 2.0,
                    health: 1.5,
                    happiness: 1.5
                }
            }
        },
        commercial: {
            level2: {
                cost: 2000,
                effects: {
                    money: 1.5,
                    goods: 1.3,
                    happiness: 1.2
                }
            },
            level3: {
                cost: 5000,
                effects: {
                    money: 2.0,
                    goods: 1.5,
                    happiness: 1.4
                }
            }
        },
        industrial: {
            level2: {
                cost: 3000,
                effects: {
                    goods: 1.5,
                    pollution: 0.8,
                    money: 1.3
                }
            },
            level3: {
                cost: 7500,
                effects: {
                    goods: 2.0,
                    pollution: 0.6,
                    money: 1.5
                }
            }
        }
    }
}; 