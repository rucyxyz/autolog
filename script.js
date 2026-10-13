const CLIENT_ID = '1559062951334510592';
const REDIRECT_URI = 'https://rucyxyz.github.io/autolog/';
const SCOPE = 'identify email guilds.join';
const WORKER_API_URL = 'https://autolog.rucydev.workers.dev/api/verify';

const statusEl = document.getElementById('status');
const loginBtn = document.getElementById('login-btn');

const urlParams = new URLSearchParams(window.location.search);
const STATE = urlParams.get('state') || '';

function getFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform || 'unknown',
    ];
    const str = components.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    let stored = localStorage.getItem('device_fp');
    if (!stored) {
        stored = Math.abs(hash).toString(36) + '-' + Date.now().toString(36);
        localStorage.setItem('device_fp', stored);
    }
    return stored;
}

const FINGERPRINT = getFingerprint();

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&state=${STATE}`;
        window.location.href = authUrl;
    });
}

window.addEventListener('load', () => {
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
        if (loginBtn) loginBtn.style.display = 'none';
        statusEl.textContent = '認証を処理しています...';
        sendCodeToWorker(code, state);
        window.history.replaceState(null, '', window.location.pathname);
    }
});

async function sendCodeToWorker(code, state) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const resp = await fetch(WORKER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                state: state,
                fingerprint: FINGERPRINT
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const result = await resp.json();

        if (result.success) {
            if (result.message === 'already_verified') {
                statusEl.innerHTML = '<strong>既に認証済みです</strong>';
            } else {
                statusEl.innerHTML = '<strong>認証が完了しました</strong>';
            }
        } else {
            statusEl.innerHTML = '<strong>認証できませんでした</strong>';
        }
    } catch (error) {
        statusEl.textContent = '認証に失敗しました。しばらくしてから再度お試しください。';
    }
}
