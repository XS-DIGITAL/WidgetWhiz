/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ChatWidget from './components/ChatWidget';

function WidgetPage() {
  const [searchParams] = useSearchParams();
  const botId = searchParams.get('botId') || undefined;
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
