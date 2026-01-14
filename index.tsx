
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const startApp = () => {
  const container = document.getElementById('root');
  if (!container) return;

  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Ocultar loader se o render for bem sucedido
    const loader = document.getElementById('main-loading');
    if (loader) loader.style.display = 'none';
    
    console.log("Hidro Clean v5.1: Inicializada com sucesso.");
  } catch (err: any) {
    console.error("Falha ao montar React:", err);
    const overlay = document.getElementById('error-overlay');
    const msgDiv = document.getElementById('error-msg');
    if (overlay && msgDiv) {
        overlay.style.display = 'flex';
        msgDiv.innerText = "React Mount Error: " + err.message;
    }
  }
};

// Garantir que o DOM está pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
