export function renderAccessDenied(reason: string) {
  return new Response(
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Access denied - Nalyy Gate</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;min-height:100vh;background:#050612;color:#f8f7ff;font-family:Inter,system-ui,sans-serif;overflow:hidden}
      body:before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 25% 20%,rgba(126,58,242,.22),transparent 34%),radial-gradient(circle at 75% 70%,rgba(14,165,233,.20),transparent 36%),linear-gradient(90deg,rgba(126,58,242,.08) 1px,transparent 1px),linear-gradient(rgba(126,58,242,.08) 1px,transparent 1px);background-size:auto,auto,64px 64px,64px 64px}
      .back{position:fixed;left:24px;top:24px;color:#b8b3d9;text-decoration:none;font-size:14px}
      main{position:relative;min-height:100vh;display:grid;place-items:center;padding:24px}
      .card{width:min(448px,100%);border:1px solid rgba(244,63,94,.45);background:rgba(16,11,28,.88);border-radius:18px;padding:32px;text-align:center;box-shadow:0 0 80px rgba(244,63,94,.12)}
      .logo{display:grid;place-items:center;margin:0 auto 28px;width:48px;height:48px;border-radius:50%;background:#070817;color:#8b5cf6;font-weight:900;box-shadow:0 0 28px rgba(139,92,246,.45)}
      .shield{display:grid;place-items:center;margin:0 auto 26px;width:64px;height:64px;border-radius:18px;border:1px solid rgba(244,63,94,.65);background:rgba(244,63,94,.12);color:#fb7185;font-size:30px;font-weight:900}
      h1{margin:0 0 14px;font-size:30px;letter-spacing:-.02em}
      p{margin:0 auto;color:#aaa3bd;line-height:1.45;max-width:340px}
      .actions{display:grid;gap:10px;margin-top:32px}
      .primary{display:block;border-radius:10px;padding:12px 16px;background:linear-gradient(90deg,#8b5cf6,#4f7cff);color:white;text-decoration:none;font-weight:700}
      .secondary{display:block;border:1px solid rgba(148,163,184,.22);border-radius:10px;padding:11px 16px;background:#080c1c;color:white;text-decoration:none;font-weight:700}
      code{display:block;margin-top:24px;color:#aaa3bd;font-size:12px}
    </style>
  </head>
  <body>
    <a class="back" href="/">&lt;- Back to home</a>
    <main>
      <section class="card">
        <div class="logo">NG</div>
        <div class="shield">!</div>
        <h1>Access Denied</h1>
        <p>${escapeHtml(reason)} This endpoint is protected by Nalyy Gate. Redeem your key through Discord, then use the generated loader.</p>
        <div class="actions">
          <a class="primary" href="/login">Sign in with Discord</a>
          <a class="secondary" href="/dashboard">Dashboard</a>
        </div>
        <code>Error code: NG_403_NO_ACCESS</code>
      </section>
    </main>
  </body>
</html>`,
    {
      status: 403,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
