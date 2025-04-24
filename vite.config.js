import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    server: {
        port: 3000,
        open: '/index.html',
        fs: {
            strict: false,
            allow: ['..']
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                // Ensure consistent chunk names
                chunkFileNames: 'assets/[name]-[hash].js',
                // Prevent dynamic imports from being inlined
                inlineDynamicImports: false
            }
        }
    },
    resolve: {
        preserveSymlinks: true,
        extensions: ['.js', '.mjs', '.json']
    },
    optimizeDeps: {
        include: ['three']
    }
}); 