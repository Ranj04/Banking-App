import './App.css';
import React from 'react';
import { useNavigate } from "react-router-dom";

function Login() {
  const [userName, setUserName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const navigate = useNavigate();

  function handleSubmit() {
    console.log('username: ' + userName + ' password: ' + password);

    const userDto = {
      password: password,
      userName: userName
    };
    console.log(userDto);

    const httpSetting = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userDto),
    };

    setMessage('');
    fetch('/createUser', httpSetting)
      .then(res => res.json())
      .then(apiResult => {
        console.log(apiResult);
        if (apiResult.status) {
          setMessage('Your account has been created');
          setPassword('');
          setUserName('');
        } else {
          setMessage(apiResult.message || 'Authentication failed, please try again.');
        }
      })
      .catch(() => {
        setMessage('Authentication failed, please try again.');
      });
  }

  function handleLogin() {
    console.log('username: ' + userName + ' password: ' + password);

    const userDto = {
      password: password,
      userName: userName
    };
    console.log(userDto);

    const httpSetting = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userDto),
    };

    setMessage('');
    fetch('/login', httpSetting)
      .then(async res => {
        if (res.ok) {
          return navigate('/home');
        }
        let errorMsg = 'Invalid credentials';
        try {
          const data = await res.json();
          if (data && data.message) errorMsg = data.message;
        } catch (e) {}
        setMessage(errorMsg);
      })
      .catch(() => {
        setMessage('Authentication failed, please try again.');
      });
  }

  function updateUserName(event) {
    setUserName(event.target.value);
  }

  function updatePassword(event) {
    setPassword(event.target.value);
  }

  return (
    <div className="App">
      <div>
        <div>
          User name: <input value={userName} onChange={updateUserName} />
        </div>
        <div>
          Password: <input type='password' value={password} onChange={updatePassword} />
        </div>
        <div>
          <button onClick={handleSubmit}>Create Account</button>
          <button onClick={handleLogin}>Login</button>
        </div>
        <div>{message}</div>
      </div>
    </div>
  );
}

export default Login;
