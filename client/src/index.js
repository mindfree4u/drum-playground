// client/src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // 필요에 따라 CSS 파일을 import 합니다.

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);