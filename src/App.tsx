import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import DashboardHome from './pages/DashboardHome';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Users from './pages/Users';
import Offers from './pages/Offers';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetails />} />
              <Route path="users" element={<Users />} />
              <Route path="offers" element={<Offers />} />
              {/* Add other protected routes here */}
              <Route path="*" element={<div className="p-10 text-center">جاري العمل على هذه الصفحة...</div>} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
