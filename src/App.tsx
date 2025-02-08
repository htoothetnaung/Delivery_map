import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapView from './components/MapView';
import AdminPanel from './components/AdminPanel';
import NotificationList from './components/NotificationList';
import Navbar from './components/Navbar';
import Authenticate from './components/Authenticate';
import PrivateRoute from './components/PrivateRoute'; // Import the PrivateRoute

const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/admin" element={<PrivateRoute element={<AdminPanel />} requiredRole="admin" />} />
          <Route path="/authenticate" element={<Authenticate />} />
          <Route path="/notifications" element={<PrivateRoute element={<NotificationList />} requiredRole="user" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;