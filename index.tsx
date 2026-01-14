
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // Remove o spinner e marca como inicializado com sucesso
    (window as any).REACT_INITIALIZED = true;
    console.log("Hidro Clean: Prontidão confirmada.");
  } catch (err: any) {
    console.error("Erro no React:", err);
    const errDet = document.getElementById('error-details');
    if (errDet) errDet.innerText = err.message;
    document.getElementById('diagnostic-card')?.style.setProperty('display', 'block', 'important');
    document.getElementById('main-spinner')?.style.setProperty('display', 'none', 'important');
  }
}
