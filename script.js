const statusEl = document.getElementById('status');
const loginBtn = document.getElementById('login-btn');

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
        if (loginBtn) loginBtn.style.display = 'none';
        statusEl.textContent = '認証中...';
        sendCodeToWorker(code, state);
        window.history.replaceState(null, '', window.location.pathname);
    }
});

async function sendCodeToWorker(code, state) {
    try {
        const resp = await fetch('https://forests-proportion-chronicle-removing.trycloudflare.com/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, state: state })
        });
        if (!resp.ok) throw new Error('通信エラー');
        const result = await resp.json();

        if (result.success) {
            statusEl.innerHTML = '<strong>✅ 認証が完了しました</strong>';
        } else {
            throw new Error(result.error || '不明なエラー');
        }
    } catch (error) {
        statusEl.textContent = '認証に失敗しました: ' + error.message;
    }
}
