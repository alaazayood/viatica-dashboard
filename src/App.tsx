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
import WarehouseProfile from './pages/WarehouseProfile';
import Finance from './pages/Finance';
import PointOfSale from './pages/PointOfSale';
import Reports from './pages/Reports';
import Returns from './pages/Returns';
import FeedManagement from './pages/FeedManagement';
import Alerts from './pages/Alerts';
import Expenses from './pages/Expenses';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';

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
              <Route path="warehouse/:id" element={<WarehouseProfile />} />
              <Route path="offers" element={<Offers />} />
              <Route path="finance" element={<Finance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="returns" element={<Returns />} />
              <Route path="pos" element={<PointOfSale />} />
              <Route path="feed" element={<FeedManagement />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="suppliers" element={<Suppliers />} />
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
