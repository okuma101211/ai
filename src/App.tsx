/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import { BetaModal } from "./components/BetaModal";

export default function App() {
  return (
    <BrowserRouter>
      <BetaModal />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
