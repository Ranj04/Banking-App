import React from 'react';

export function useUsername() {
  const [username, setUsername] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    async function tryFetch(url) {
      try {
        const r = await fetch(url, { credentials: 'include' });
        if (!r.ok) return null;
        const j = await r.json().catch(() => ({}));
        return j;
      } catch { return null; }
    }

    (async () => {
      const candidates = ['/auth/whoami', '/whoami', '/me', '/user/me'];
      for (const c of candidates) {
        const j = await tryFetch(c);
        const name = j?.data?.userName || j?.userName || j?.username || j?.name;
        if (name && !cancelled) { setUsername(name); return; }
      }
      // Try both common localStorage key variants
      try {
        const lsPrimary = localStorage.getItem('userName');
        const lsAlt = localStorage.getItem('username');
        const finalName = lsPrimary || lsAlt;
        if (finalName && !cancelled) setUsername(finalName);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, []);

  return username;
}

function possessive(name) {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
}

export default function Header() {
  const username = useUsername();

  const go = (path) => { window.location.href = path; };

  async function logout() {
    try {
      const r = await fetch('/logout', { method: 'POST', credentials: 'include' });
      if (!r.ok) await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.href = '/';
  }

  return (
    <header className="app-header">
      <div className="app-brand">
  <div className="brand-title">{username ? `${possessive(username)} Savings App` : 'Savings App'}</div>
        <div className="brand-tag">helping you achieve your financial goals!</div>
      </div>
      <nav className="nav-actions">
        <button className="btn-link" onClick={() => go('/home')}>Home</button>
        <button className="btn-link" onClick={() => go('/accounts')}>Accounts</button>
        <button className="btn-link" onClick={() => go('/goals')}>Goals</button>
        <button className="btn-link danger" onClick={logout}>Log out</button>
      </nav>
    </header>
  );
}
