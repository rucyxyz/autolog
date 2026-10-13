const WORKER_API_URL = 'https://autolog.rucydev.workers.dev/api/verify';

const statusEl = document.getElementById('status');

const urlParams = new URLSearchParams(window.location.search);
const CODE = urlParams.get('code');
const STATE = urlParams.get('state');

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

window.addEventListener('load', () => {
    if (!CODE) {
        statusEl.textContent = 'Discordの認証ボタンからアクセスしてください。';
        return;
    }

    statusEl.textContent = '認証を処理しています...';
    sendCodeToWorker(CODE, STATE);
    window.history.replaceState(null, '', window.location.pathname);
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
        const reason = result.reason || (result.success ? 'success' : 'user_info_failed');
        const message = MESSAGES[reason] || 'ユーザー情報の取得に失敗しました';

        statusEl.innerHTML = `<strong>${message}</strong>`;
    } catch (error) {
        statusEl.textContent = 'ユーザー情報の取得に失敗しました';
    }
}
