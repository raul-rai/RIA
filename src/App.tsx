import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OndaPage from './pages/OndaPage';
import PrivacyPage from './pages/PrivacyPage';
import ConsentBar from './components/ConsentBar';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onda" element={<OndaPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
      </Routes>
      {/* Fora do <Routes>: o aviso de medição vale para o site inteiro, não
          para uma rota. Ele se esconde sozinho quando não há analytics
          configurado ou quando o visitante já decidiu. */}
      <ConsentBar />
    </>
  );
}
