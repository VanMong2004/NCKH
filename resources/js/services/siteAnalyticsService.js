import api from './api';

const VISITOR_KEY = 'ctut_visitor_id';
const SESSION_KEY = 'ctut_session_id';

const siteAnalyticsService = {
    trackPageView(pathname, extra = {}) {
        return track('page_view', {
            url: window.location.href,
            referrer: document.referrer || '',
            metadata: {
                pathname,
                ...extra,
            },
        });
    },

    trackProductView(product) {
        if (!product?.id) return Promise.resolve();

        return track('product_view', {
            entity_type: 'product',
            entity_id: product.id,
            product_id: product.id,
            url: window.location.href,
            referrer: document.referrer || '',
            metadata: {
                slug: product.slug || '',
                name: product.name || '',
            },
        });
    },
};

async function track(eventType, payload = {}) {
    try {
        await api.post('/analytics/events', {
            event_type: eventType,
            visitor_id: getVisitorId(),
            session_id: getSessionId(),
            ...payload,
        });
    } catch (_) {
        // Analytics khong duoc lam gian doan trai nghiem nguoi dung.
    }
}

function getVisitorId() {
    let visitorId = localStorage.getItem(VISITOR_KEY);

    if (!visitorId) {
        visitorId = createId('visitor');
        localStorage.setItem(VISITOR_KEY, visitorId);
    }

    return visitorId;
}

function getSessionId() {
    let sessionId = sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
        sessionId = createId('session');
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
}

function createId(prefix) {
    if (window.crypto?.randomUUID) {
        return `${prefix}_${window.crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default siteAnalyticsService;
