
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Iniciando aplicação Hidro Clean...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Erro crítico na renderização do React:", error);
  rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
    <h2>Erro ao carregar aplicação</h2>
    <p>Verifique o console do navegador para mais detalhes.</p>
  </div>`;
}
