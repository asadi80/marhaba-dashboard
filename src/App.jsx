// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UserDetailPage from "./pages/UserDetailPage";
import DatabaseSchemaPage from "./pages/DatabaseSchemaPage";
import DatabaseExplorer from "./pages/DatabaseExplorer";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/users/:id" element={<UserDetailPage />} />

        {/* Keep old route for backward compatibility if needed */}
        <Route path="/user/:id" element={<UserDetailPage />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/database-schema" element={<DatabaseSchemaPage />} />
        <Route path="/database" element={<DatabaseExplorer />} />

        {/* Redirect root to admin */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
