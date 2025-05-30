import React from 'react';
import MainMenu from './MainMenu';
import './Layout.css';

function Layout({ children, isAdmin }) {
  return (
    <div className="layout">
      <MainMenu isAdmin={isAdmin} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout; 