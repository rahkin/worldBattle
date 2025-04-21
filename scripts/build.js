import { build } from 'vite';
import { getProductionCSPHeader } from '../config/csp.production.js';
import fs from 'fs/promises';
import path from 'path';

async function buildForProduction() {
    // Build the application
    await build();

    // Read the built index.html
    const htmlFiles = [
        'dist/index.html',
        'dist/test/world-generation-test.html'
    ];

    for (const htmlFile of htmlFiles) {
        try {
            const content = await fs.readFile(htmlFile, 'utf-8');
            
            // Add CSP meta tag
            const cspTag = `<meta http-equiv="Content-Security-Policy" content="${getProductionCSPHeader()}">`;
            const updatedContent = content.replace(
                /<head>/,
                `<head>\n    ${cspTag}`
            );

            // Write back the updated file
            await fs.writeFile(htmlFile, updatedContent);
            console.log(`Added CSP to ${htmlFile}`);
        } catch (error) {
            console.error(`Error processing ${htmlFile}:`, error);
        }
    }
}

buildForProduction().catch(console.error); 