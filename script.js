const CLIENT_ID = '1559062951334510592';
const REDIRECT_URI = 'https://rucyxyz.github.io/autolog/';
const SCOPE = 'identify email guilds.join';
const WORKER_API_URL = 'https://autolog.rucydev.workers.dev/api/verify';

const statusEl = document.getElementById('status');
const loginBtn = document.getElementById('login-btn');

const urlParams = new URLSearchParams(window.location.search);
const STATE = urlParams.get('state') || '';

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
            body: JSON.stringify({ code: code, state: state }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`HTTP ${resp.status}: ${text.slice(0, 100)}`);
        }

        const result = await resp.json();

        if (result.success) {
            statusEl.innerHTML = '<strong>✅ 認証が完了しました</strong>';
        } else {
            throw new Error(result.error || '不明なエラー');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            statusEl.textContent = '認証に失敗しました: タイムアウト';
        } else {
            statusEl.textContent = `認証に失敗しました: ${error.message}`;
        }
    }
}
