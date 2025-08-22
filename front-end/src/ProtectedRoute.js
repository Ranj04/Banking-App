// front-end/src/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState('checking'); // checking | authed | anon

  useEffect(() => {
    const ac = new AbortController();
    const timer = setTimeout(() => {
      console.log('ProtectedRoute: Timeout reached, setting state to anon');
      setState('anon');
    }, 4000); // fail-safe
    
    console.log('ProtectedRoute: Starting authentication check...');
    
    (async () => {
      try {
        console.log('ProtectedRoute: Fetching /auth/whoami...');
        const response = await fetch('/auth/whoami', { credentials: 'include', signal: ac.signal });
        console.log('ProtectedRoute: /auth/whoami response status:', response.status);
        
        if (response.ok) {
          try {
            const data = await response.json();
            console.log('ProtectedRoute: /auth/whoami response data:', data);
            
            if (data.success === false) {
              console.error('ProtectedRoute: Authentication check failed:', data.message);
              setState('anon');
            } else {
              console.log('ProtectedRoute: Authentication successful, setting state to authed');
              setState('authed');
            }
          } catch (jsonError) {
            console.error('ProtectedRoute: Failed to parse JSON response:', jsonError);
            setState('anon');
          }
        } else {
          console.error('ProtectedRoute: Authentication check failed with status:', response.status);
          setState('anon');
        }
      } catch (error) {
        if (!ac.signal.aborted) {
          console.error('ProtectedRoute: Error during authentication check:', error);
          setState('anon');
        }
      } finally {
        if (!ac.signal.aborted) {
          console.log('ProtectedRoute: Clearing timeout');
          clearTimeout(timer);
        }
      }
    })();
    
    return () => { 
      console.log('ProtectedRoute: Cleaning up...');
      ac.abort(); 
      clearTimeout(timer); 
    };
  }, []);

  console.log('ProtectedRoute: Current state:', state);
  
  if (state === 'checking') {
    console.log('ProtectedRoute: Showing loading state');
    return <div style={{ padding: '20px', textAlign: 'center' }}>Checking authentication...</div>;
  }
  
  if (state === 'anon') {
    console.log('ProtectedRoute: Redirecting to login');
    return <Navigate to="/" replace />;
  }
  
  console.log('ProtectedRoute: Rendering protected content');
  return children;
}
