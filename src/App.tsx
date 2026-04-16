/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ChatWidget from './components/ChatWidget';

function WidgetPage() {
  const [searchParams] = useSearchParams();
  const botId = searchParams.get('botId') || undefined;

  useEffect(() => {
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.setProperty('background-color', 'transparent', 'important');
    document.body.style.setProperty('background-color', 'transparent', 'important');
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return <ChatWidget botId={botId} isEmbedded={true} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="relative min-h-screen">
            <Dashboard />
            <ChatWidget />
          </div>
        } />
        <Route path="/widget" element={<WidgetPage />} />
      </Routes>
    </BrowserRouter>
  );
}
