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

const MESSAGES = {
    success: '認証が完了しました',
    already_verified: '既に認証済みです',
    vpn_proxy: 'VPN・Proxy接続が検出されました',
    mobile: '4G・5Gからのアクセスが検出されました',
    duplicate: '同一IPアドレスからのアクセスが検出されました',
    banned_ip: 'BANされたIPアドレスからのアクセスが検出されました',
    user_info_failed: 'ユーザー情報の取得に失敗しました',
    token_error: 'ユーザー情報の取得に失敗しました',
    missing_code: 'ユーザー情報の取得に失敗しました',
    no_data: 'ユーザー情報の取得に失敗しました'
};

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
        const reason = result.reason || (result.success ? 'success' : 'user_info_failed');
        const message = MESSAGES[reason] || 'ユーザー情報の取得に失敗しました';

        statusEl.innerHTML = `<strong>${message}</strong>`;
    } catch (error) {
        statusEl.textContent = 'ユーザー情報の取得に失敗しました';
    }
}
