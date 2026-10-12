const CLIENT_ID = '1559062951334510592';
const REDIRECT_URI = 'https://rucyxyz.github.io/autolog/';
const SCOPE = 'identify email guilds.join';
const RESPONSE_TYPE = 'code';
const WORKER_API_URL = 'https://forests-proportion-chronicle-removing.trycloudflare.com/api/verify';

const loginBtn = document.getElementById('login-btn');
const statusEl = document.getElementById('status');

const urlParams = new URLSearchParams(window.location.search);
const STATE = urlParams.get('state') || '';

loginBtn.addEventListener('click', () => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPE)}&state=${STATE}`;
    window.location.href = authUrl;
});

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
        loginBtn.disabled = true;
        statusEl.textContent = '認証中...';
        sendCodeToWorker(code, state);
        window.history.replaceState(null, '', window.location.pathname);
    }
});

async function sendCodeToWorker(code, state) {
    try {
        const resp = await fetch(WORKER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, state: state })
        });
        if (!resp.ok) throw new Error('Workerへの送信に失敗');
        const result = await resp.json();

        if (result.success) {
            statusEl.innerHTML = `
                <div style="text-align:left;background:#f6f6f6;padding:12px;border-radius:8px;font-size:13px;">
                    <strong>認証成功</strong><br>
                    ユーザー名: ${result.username || '不明'}<br>
                    ID: ${result.user_id || '不明'}<br>
                    メール: ${result.email || '非公開'}
                </div>
            `;
        } else {
            throw new Error(result.error || '不明なエラー');
        }
    } catch (error) {
        statusEl.textContent = '認証に失敗しました: ' + error.message;
        loginBtn.disabled = false;
    }
}
