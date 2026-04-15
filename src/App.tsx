/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dashboard from './components/Dashboard';
import ChatWidget from './components/ChatWidget';

export default function App() {
  return (
    <div className="relative min-h-screen">
      <Dashboard />
      <ChatWidget />
    </div>
  );
}
