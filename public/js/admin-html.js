'use strict';

function escapeAdminText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function cvAction(name, args, value = false) {
    return escapeAdminText(JSON.stringify({ name, args, value }));
}

function sanitizeAdminHtml(value) {
    return DOMPurify.sanitize(String(value ?? ''), {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['style', 'form', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['style', 'srcdoc']
    });
}

// Generated controls use data, never executable event-handler strings.
const adminActions = new Set([
    'removeSkill', 'updateExperience', 'removeExperience', 'updateCompanyStatus',
    'openOutlookCompose', 'markAsApplied', 'updateContactName', 'copyContact',
    'deleteContact', 'openJobUrl', 'applyToSingleJob', 'addJobToCompanies',
    'stopProcess', 'searchForSkill', 'runSearch'
]);
for (const eventName of ['click', 'change']) {
    document.addEventListener(eventName, event => {
        const element = event.target.closest(`[data-cv-${eventName}]`);
        if (!element) return;
        let action;
        try { action = JSON.parse(element.getAttribute(`data-cv-${eventName}`)); } catch { return; }
        if (!action || !adminActions.has(action.name) || !Array.isArray(action.args) || action.args.some(arg => !['string', 'number', 'boolean'].includes(typeof arg))) return;
        const callback = window[action.name];
        if (typeof callback !== 'function') return;
        const args = action.value ? [...action.args, element.value] : action.args;
        callback(...args);
    });
}

function openAdminUrl(input, target = '_blank') {
    const url = new URL(input, location.href);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('Only HTTP(S) links are allowed');
    }
    return window.open(url.href, target, 'noopener,noreferrer');
}
