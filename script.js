const WORKER_API_URL = 'https://forests-proportion-chronicle-removing.trycloudflare.com/api/verify';

const statusEl = document.getElementById('status');
const loginBtn = document.getElementById('login-btn');

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
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

        const text = await resp.text();
        console.log('Response status:', resp.status);
        console.log('Response body:', text);

        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error('無効なレスポンス: ' + text.slice(0, 200));
        }

        if (result.success) {
            statusEl.innerHTML = '<strong>✅ 認証が完了しました</strong>';
        } else {
            throw new Error(result.error || '不明なエラー');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            statusEl.textContent = '認証に失敗: タイムアウト (15秒)';
        } else {
            statusEl.textContent = `認証に失敗: ${error.message}`;
        }
        console.error('Full error:', error);
    }
}
