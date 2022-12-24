import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { EventProvider } from './context/EventContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const container = document.getElementById('root');

if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <EventProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </EventProvider>
    </React.StrictMode>
  );
}
