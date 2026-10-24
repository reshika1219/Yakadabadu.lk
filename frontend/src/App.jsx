// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverProfile from './pages/DriverProfile';
import SchedulePickup from './pages/SchedulePickup';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Driver-only pages: customers are sent to the pickup form instead
const DriverRoute = ({ children }) => (
  <ProtectedRoute>
    {localStorage.getItem('role') === 'user' ? <Navigate to="/schedule-pickup" /> : children}
  </ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/schedule-pickup" element={<ProtectedRoute><SchedulePickup /></ProtectedRoute>} />
        <Route path="/home" element={<DriverRoute><Home /></DriverRoute>} />
        <Route path="/driver-dashboard" element={<DriverRoute><DriverDashboard /></DriverRoute>} />
        <Route path="/admin-dashboard" element={<DriverRoute><AdminDashboard /></DriverRoute>} />
        <Route path="/driver-profile" element={<DriverRoute><DriverProfile /></DriverRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
