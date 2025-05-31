import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Murillo Insurance Security Demo</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Enhanced Security Features Active:</h2>
        <ul>
          <li>✓ Scrypt password hashing with timing-safe comparisons</li>
          <li>✓ Rate limiting protection</li>
          <li>✓ Input validation and sanitization</li>
          <li>✓ CSRF protection headers</li>
          <li>✓ Security logging and monitoring</li>
        </ul>
      </div>
      <div style={{ marginTop: '30px' }}>
        <a href="/auth" style={{ 
          background: '#007bff', 
          color: 'white', 
          padding: '10px 20px', 
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          Go to Authentication
        </a>
      </div>
    </div>
  );
}

export default App;