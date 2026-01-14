
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const renderApp = () => {
  const container = document.getElementById('root');
  if (!container) return;

  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React Rendered Successfully");
  } catch (err: any) {
    console.error("React Render Error:", err);
    showError(err.message);
  }
};

const showError = (msg: string) => {
  const errorDisplay = document.getElementById('error-display');
  const errorDetails = document.getElementById('error-details');
  if (errorDisplay) errorDisplay.style.display = 'flex';
  if (errorDisplay) errorDisplay.style.flexDirection = 'column';
  if (errorDetails) errorDetails.innerText = msg;
};

// Tenta iniciar a aplicação
try {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    renderApp();
  } else {
    window.addEventListener('DOMContentLoaded', renderApp);
  }
} catch (e: any) {
  showError(e.message);
}

// Handler para falhas catastróficas de rede/módulos
window.addEventListener('error', (event) => {
  if (event.message && (event.message.includes('import') || event.message.includes('Script error'))) {
    showError("Falha ao carregar bibliotecas externas (esm.sh). Verifique a sua ligação à internet.");
  }
});
