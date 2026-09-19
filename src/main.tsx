import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Suppress benign WebSocket errors from Vite HMR in the AI Studio environment
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (!reason) return;
  
  const msg = typeof reason === 'string' ? reason : (reason.message || '');
  if (msg.includes('WebSocket') || msg.includes('closed') || msg.includes('websocket')) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

