import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapView from './components/MapView';
import AdminPanel from './components/AdminPanel';
import NotificationList from './components/NotificationList';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
        <NotificationList />
      </div>
    </Router>
  );
};
export default App;