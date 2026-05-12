import React from 'react';
import ReactDOM from 'react-dom/client';
import ShepherdTranscription from './App';  // Changed from 'App' to match default export

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ShepherdTranscription />
  </React.StrictMode>
);