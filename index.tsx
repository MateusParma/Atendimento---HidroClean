
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Sinaliza que o código JS começou a ser processado
(window as any).REACT_INITIALIZED = true;

const container = document.getElementById('root');

if (container) {
  try {
    // Remove as classes de centralização do loader ao montar o app
    container.className = '';
    
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Hidro Clean: Sistema montado com sucesso.");
  } catch (err: any) {
    console.error("Erro Crítico na Montagem:", err);
    const errDet = document.getElementById('error-details');
    const diagCard = document.getElementById('diagnostic-card');
    const spinner = document.getElementById('main-spinner');
    
    if (spinner) spinner.classList.add('hidden');
    if (errDet) errDet.innerText = `Render Error: ${err.message}\nStack: ${err.stack?.substring(0, 100)}`;
    if (diagCard) diagCard.classList.remove('hidden');
  }
}
