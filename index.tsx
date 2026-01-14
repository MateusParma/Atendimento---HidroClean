
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
    console.log("Hidro Clean: App mounted.");
  } catch (err: any) {
    console.error("Mount Error:", err);
    const errDisp = document.getElementById('error-display');
    const errDet = document.getElementById('error-details');
    if (errDisp) errDisp.style.display = 'flex';
    if (errDet) errDet.innerText = err.message || "Unknown rendering error";
  }
}
