import { useEffect, useState } from 'react';

export function useUsername() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/auth/whoami', { credentials: 'include', signal: ac.signal });
        if (!res.ok) throw new Error(`whoami ${res.status}`);
        const data = await res.json();
        
        if (data.success === false) {
          console.error('Failed to get username:', data.message);
          if (!ac.signal.aborted) { setUsername(''); }
          return;
        }
        
        // Accept either userName or username shapes
        const name = data.userName ?? data.username ?? null;
        if (name && !ac.signal.aborted) { setUsername(name); }
      } catch (error) {
        if (!ac.signal.aborted) { 
          console.error('Error getting username:', error);
          setUsername(''); 
        }
      }
    })();
    return () => ac.abort();
  }, []);

  return username;
}

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/auth/whoami', { credentials: 'include', signal: ac.signal });
        if (!res.ok) throw new Error('not authed');
        const data = await res.json();
        
        if (data.success === false) {
          console.error('Failed to get user data:', data.message);
          if (!ac.signal.aborted) { setUser(null); }
          return;
        }
        
        if (!ac.signal.aborted) {
          setUser(data.userName ?? data.username ?? null);
        }
      } catch (error) {
        if (!ac.signal.aborted) { 
          console.error('Error getting user data:', error);
          setUser(null); 
        }
      }
    })();
    return () => ac.abort();
  }, []);

  return (
    <header className="app-header">
      <div className="app-brand">
        <div className="brand-title">{user ? `${user}'s Savings App` : 'Savings App'}</div>
        <div className="brand-tag">helping you achieve your financial goals!</div>
      </div>
      <nav className="nav-actions">
        <button className="btn-link" onClick={() => window.location.href = '/home'}>Home</button>
        <button className="btn-link" onClick={() => window.location.href = '/accounts'}>Accounts</button>
        <button className="btn-link" onClick={() => window.location.href = '/goals'}>Goals</button>
        <button className="btn-link danger" onClick={async () => {
          try {
            const r = await fetch('/logout', { method: 'POST', credentials: 'include' });
            if (r.ok) {
              const data = await r.json();
              if (data.success === false) {
                console.error('Logout failed:', data.message);
              }
            } else {
              console.error('Logout failed:', r.status);
              // Try fallback logout endpoint
              try {
                const fallbackResponse = await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
                if (fallbackResponse.ok) {
                  const fallbackData = await fallbackResponse.json();
                  if (fallbackData.success === false) {
                    console.error('Fallback logout failed:', fallbackData.message);
                  }
                } else {
                  console.error('Fallback logout failed:', fallbackResponse.status);
                }
              } catch (fallbackError) {
                console.error('Error during fallback logout:', fallbackError);
              }
            }
          } catch (error) {
            console.error('Error during logout:', error);
          }
          window.location.href = '/';
        }}>Log out</button>
      </nav>
    </header>
  );
}
