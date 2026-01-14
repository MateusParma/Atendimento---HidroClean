
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const startApp = () => {
  const rootElement = document.getElementById('root');
  const errorDisplay = document.getElementById('error-display');

  if (!rootElement) return;

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Hidro Clean montado com sucesso.");
  } catch (error) {
    console.error("Falha ao renderizar App:", error);
    if (rootElement) rootElement.style.display = 'none';
    if (errorDisplay) errorDisplay.style.display = 'block';
  }
};

// Garante que o DOM está pronto e lida com possíveis erros de importação
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Global error handler para capturar falhas de rede/módulos
window.addEventListener('error', (event) => {
  if (event.message.includes('import') || event.message.includes('Script error')) {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) errorDisplay.style.display = 'block';
  }
});
