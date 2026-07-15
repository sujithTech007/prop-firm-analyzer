import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Overview from './pages/Overview';
import History from './pages/History';
import Insights from './pages/Insights';
import NewAnalysis from './pages/NewAnalysis/NewAnalysis';
import Results from './pages/Results';
import Academy from './pages/Academy';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  // Generate session ID on first load
  useEffect(() => {
    if (!localStorage.getItem('analyzer_session_id')) {
      const sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('analyzer_session_id', sessionId);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="new" element={<NewAnalysis />} />
          <Route path="history" element={<History />} />
          <Route path="insights" element={<Insights />} />
          <Route path="academy" element={<Academy />} />
          <Route path="settings" element={<Settings />} />
          <Route path="results/:id" element={<Results />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" />
    </Router>
  );
}
