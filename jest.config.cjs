module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    moduleFileExtensions: ['js'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./jest.setup.cjs'],
    moduleNameMapper: {
        '^three$': '<rootDir>/node_modules/three/build/three.module.js'
    }
}; 