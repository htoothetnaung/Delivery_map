import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ padding: '1rem', background: '#eee' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Map</Link>
      <Link to="/notifications">Notifications</Link>
    </nav>
  );
};

export default Navbar;