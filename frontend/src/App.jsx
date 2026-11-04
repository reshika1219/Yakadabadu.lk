import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, RequireRole } from './auth';
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Prices from './pages/public/Prices';
import Marketplace from './pages/public/Marketplace';
import ListingDetail from './pages/public/ListingDetail';
import { About, Help, Legal, NotFound } from './pages/public/Info';
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';

import CustomerDashboard from './pages/customer/Dashboard';
import Schedule from './pages/customer/Schedule';
import CustomerPickups from './pages/customer/Pickups';
import PickupDetail from './pages/customer/PickupDetail';
import Invoice from './pages/customer/Invoice';
import MyMarket from './pages/customer/MyMarket';
import Earnings from './pages/customer/Earnings';

import DriverDashboard from './pages/driver/Dashboard';
import DriverPickups from './pages/driver/Pickups';
import Availability from './pages/driver/Availability';
import Performance from './pages/driver/Performance';

import Overview from './pages/admin/Overview';
import AdminPickups from './pages/admin/Pickups';
import Dispatch from './pages/admin/Dispatch';
import Staff from './pages/admin/Staff';
import Customers from './pages/admin/Customers';
import AdminMarketplace from './pages/admin/Marketplace';
import Finance from './pages/admin/Finance';
import Pricing from './pages/admin/Pricing';
import Reviews from './pages/admin/Reviews';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route index element={<Homepage />} />
          <Route path="login" element={<Login />} />
          <Route path="prices" element={<Prices />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="marketplace/:id" element={<ListingDetail />} />
          <Route path="about" element={<About />} />
          <Route path="help" element={<Help />} />
          <Route path="privacy" element={<Legal kind="privacy" />} />
          <Route path="terms" element={<Legal kind="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Customer */}
        <Route path="/app" element={<RequireRole roles={['user']}><AppLayout role="user" /></RequireRole>}>
          <Route index element={<CustomerDashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="pickups" element={<CustomerPickups />} />
          <Route path="pickups/:id" element={<PickupDetail />} />
          <Route path="pickups/:id/invoice" element={<Invoice />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="marketplace/:id" element={<ListingDetail />} />
          <Route path="market" element={<MyMarket />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="prices" element={<Prices />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="help" element={<Help />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        {/* Driver */}
        <Route path="/driver" element={<RequireRole roles={['driver']}><AppLayout role="driver" /></RequireRole>}>
          <Route index element={<DriverDashboard />} />
          <Route path="pickups" element={<DriverPickups />} />
          <Route path="availability" element={<Availability />} />
          <Route path="performance" element={<Performance />} />
          <Route path="prices" element={<Prices />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="help" element={<Help />} />
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<RequireRole roles={['admin']}><AppLayout role="admin" /></RequireRole>}>
          <Route index element={<Overview />} />
          <Route path="pickups" element={<AdminPickups />} />
          <Route path="dispatch" element={<Dispatch />} />
          <Route path="staff" element={<Staff />} />
          <Route path="customers" element={<Customers />} />
          <Route path="marketplace" element={<AdminMarketplace />} />
          <Route path="finance" element={<Finance />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Old URLs keep working */}
        <Route path="/home" element={<Navigate to="/driver" replace />} />
        <Route path="/driver-dashboard" element={<Navigate to="/driver" replace />} />
        <Route path="/driver-profile" element={<Navigate to="/driver/profile" replace />} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/schedule-pickup" element={<Navigate to="/app/schedule" replace />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3500} hideProgressBar closeOnClick pauseOnHover />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
