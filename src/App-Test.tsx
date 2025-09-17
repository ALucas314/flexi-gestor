import React from 'react';

const App = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '32px', marginBottom: '20px' }}>
        🎯 Flexi Gestor - Teste
      </h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        Se você está vendo esta mensagem, a aplicação está funcionando!
      </p>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>✅ Status da Aplicação:</h2>
        <ul>
          <li>✅ React funcionando</li>
          <li>✅ Vite funcionando</li>
          <li>✅ Build funcionando</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
