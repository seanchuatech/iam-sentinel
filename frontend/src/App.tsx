import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Placeholder pages — will be built in Phase 4
function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 rounded-xl border"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-primary-light)' }}>
          🛡️ Sentinel
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Identity & Access Management
        </p>
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Phase 1 scaffolding complete — dashboard coming in Phase 4.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
