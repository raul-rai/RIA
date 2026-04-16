import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OndaPage from './pages/OndaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onda" element={<OndaPage />} />
    </Routes>
  );
}
