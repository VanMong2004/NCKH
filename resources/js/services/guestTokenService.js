const GUEST_TOKEN_KEY = 'ctut_guest_token';

function makeGuestToken() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const guestTokenService = {
    getToken() {
        let token = localStorage.getItem(GUEST_TOKEN_KEY);

        if (!token) {
            token = makeGuestToken();
            localStorage.setItem(GUEST_TOKEN_KEY, token);
        }

        return token;
    },

    peekToken() {
        return localStorage.getItem(GUEST_TOKEN_KEY);
    },

    resetToken() {
        const token = makeGuestToken();
        localStorage.setItem(GUEST_TOKEN_KEY, token);

        return token;
    },

    removeToken() {
        localStorage.removeItem(GUEST_TOKEN_KEY);
    },
};

export default guestTokenService;
