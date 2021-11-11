import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import App from './App';
import './index.css';

// Defines the root element to append React.
const rootElement = document.getElementById("root");

// Renders the React DOM
ReactDOM.render(<App />, rootElement);
registerServiceWorker();