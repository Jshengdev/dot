import React from 'react';
import ReactDOM from 'react-dom/client';
// The FROZEN bedrock — imported straight from design/ so the lab can never drift
// from the locked token values. (vite.config relaxes fs.strict to allow this.)
import '../../../design/tokens.css';
import './styles/fonts.css';
import './styles/lab.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* the whole lab lives inside the clean-blue brand world */}
    <div className="brand-clean-blue lab-root">
      <App />
    </div>
  </React.StrictMode>,
);
