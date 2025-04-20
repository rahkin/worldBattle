module.exports = {
    testEnvironment: 'jsdom',
    transform: {},
    moduleFileExtensions: ['js'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./jest.setup.cjs'],
    moduleNameMapper: {
        '^three$': '<rootDir>/node_modules/three/build/three.module.js'
    },
    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons']
    }
};