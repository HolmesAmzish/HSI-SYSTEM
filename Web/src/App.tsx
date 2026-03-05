import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import HomePage from '@/pages/HomePage';
import ViewerPage from '@/pages/ViewerPage';
import HsiManagePage from '@/pages/HsiManagePage';
import GroundTruthPage from '@/pages/GroundTruthPage';
import InferencePage from '@/pages/InferencePage';
import DatasetsPage from '@/pages/DatasetsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/viewer" element={<ViewerPage />} />
          <Route path="/hsi-manage" element={<HsiManagePage />} />
          <Route path="/ground-truth" element={<GroundTruthPage />} />
          <Route path="/inference" element={<InferencePage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App;
