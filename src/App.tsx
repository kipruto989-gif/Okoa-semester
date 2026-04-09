import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { Toaster } from "sonner";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SemesterSetup from "./pages/SemesterSetup";
import UnitDetail from "./pages/UnitDetail";
import Upload from "./pages/Upload";
import Notes from "./pages/Notes";
import Admin from "./pages/Admin";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          
          <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/semester" element={<SemesterSetup />} />
            <Route path="/dashboard/units/:unitId" element={<UnitDetail />} />
            <Route path="/dashboard/units/:unitId/upload" element={<Upload />} />
            <Route path="/dashboard/units/:unitId/notes/:documentId" element={<Notes />} />
            <Route path="/dashboard/admin" element={auth.currentUser?.email === "kipruto989@gmail.com" ? <Admin /> : <Navigate to="/dashboard" />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
