
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Sinaliza ao sistema de diagnóstico que o JS começou a ser executado
(window as any).REACT_INITIALIZED = true;

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Hidro Clean: App successfully mounted.");
  } catch (err: any) {
    console.error("Critical Mount Error:", err);
    const errDet = document.getElementById('error-details');
    const diagCard = document.getElementById('diagnostic-card');
    if (errDet) errDet.innerText = `Render Error: ${err.message}`;
    if (diagCard) diagCard.classList.remove('hidden');
  }
}
