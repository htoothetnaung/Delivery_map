import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ padding: '1rem', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ margin: 0 }}>Delivery Map System</h1>
        <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}>
          🟥 Red pin: Delivery points | 🔵 Blue pin: Warehouse & Customer Service | 🟢 Green circle: Driver's location
        </p>
      </div>
      <div>
        <Link to="/" style={{ marginRight: '1rem' }}>Map</Link>
        <Link to="/notifications" style={{ marginRight: '1rem' }}>Notifications</Link>
        <Link to="/authenticate">Authenticate</Link>
      </div>
    </nav>
  );
};

export default Navbar;