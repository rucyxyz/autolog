const CLIENT_ID = 'YOUR_CLIENT_ID'; // ← ここをあなたのClient IDに変更
const REDIRECT_URI = 'https://YOUR_USERNAME.github.io/REPO_NAME/';
const SCOPE = 'identify email';
const RESPONSE_TYPE = 'token';

const loginBtn = document.getElementById('login-btn');
const statusEl = document.getElementById('status');

loginBtn.addEventListener('click', () => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;
    window.location.href = authUrl;
});

window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        loginBtn.disabled = true;
        statusEl.textContent = '認証中...';
        fetchUserData(accessToken);
        window.history.replaceState(null, '', window.location.pathname);
    }
});

async function fetchUserData(token) {
    try {
        const resp = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error('ユーザー情報取得失敗');
        const user = await resp.json();

        const email = user.email || '非公開';
        const username = user.username;
        const id = user.id;
        const createdAt = new Date(Number(id) / 4194304 + 1420070400000);
        const createdDate = createdAt.toLocaleString('ja-JP');

        const embed = {
            title: '✅ 認証完了',
            color: 0x5865F2,
            fields: [
                { name: 'ユーザー名', value: username, inline: false },
                { name: 'ID', value: id, inline: false },
                { name: 'アカウント作成日', value: createdDate, inline: false },
                { name: 'メールアドレス', value: email, inline: false },
                { name: 'IPアドレス', value: '（サーバー側で記録）', inline: false }
            ],
            timestamp: new Date().toISOString()
        };

        statusEl.innerHTML = `
            <div style="text-align:left;background:#f6f6f6;padding:12px;border-radius:8px;font-size:13px;">
                <strong>✅ 認証成功</strong><br>
                ユーザー名: ${username}<br>
                ID: ${id}<br>
                メール: ${email}
            </div>
        `;

        // BotのWebhookまたはAPIにデータを送信（任意）
        // await sendToBot(user, token);

    } catch (error) {
        statusEl.textContent = '❌ 認証に失敗しました: ' + error.message;
        loginBtn.disabled = false;
    }
}
