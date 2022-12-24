import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Bootstrap must load before the app's stylesheets (App.jsx imports App.css),
// otherwise its rules win every tie and override the theme.
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { EventProvider } from './context/EventContext';

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
