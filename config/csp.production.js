// Production Content Security Policy configuration
export const productionCSP = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", 'blob:'],
    'worker-src': ["'self'", 'blob:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'connect-src': ["'self'"]
};

// Convert CSP object to string
export function generateCSPString(csp) {
    return Object.entries(csp)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}

// Use this when building for production
export function getProductionCSPHeader() {
    return generateCSPString(productionCSP);
} 