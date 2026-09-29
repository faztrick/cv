'use strict';

// Same-origin API requests carry a non-simple header for CSRF protection.
const originalAdminFetch = window.fetch.bind(window);
window.fetch = (input, options = {}) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (url.origin === location.origin && url.pathname.toLowerCase().startsWith('/api/')) {
        const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('X-CV-Request', '1');
        options = { ...options, headers };
    }
    return originalAdminFetch(input, options);
};
