import {createRoot} from 'react-dom/client';
import App from './App';
import {Buffer} from 'buffer';
import 'animate.css/animate.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {initHtmlElements} from './tools';
import {NetworkSettingsProvider} from './contexts/NetworkContext';
import {RecoilRoot} from 'recoil';
globalThis.Buffer = Buffer;

// Render your React component instead
const root = createRoot(document.getElementById('root'));
initHtmlElements();
root.render(
  <NetworkSettingsProvider>
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </NetworkSettingsProvider>,
);
