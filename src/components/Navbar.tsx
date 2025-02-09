import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [invoice, setInvoice] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");

  useEffect(() => {
    // Fetching drivers from db.json (assuming an API call or direct import)
    const fetchDrivers = async () => {
      try {
        const response = await fetch("src/mock/db.json"); // Adjust path as needed
        const data = await response.json();
        const driverList = data.deliveries.map((delivery: { id: string; driverName: string }) => ({
          id: delivery.id,
          name: delivery.driverName
        }));
        setDrivers(driverList);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    fetchDrivers();
  }, []);

  const handleSearch = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const searchEvent = new CustomEvent('invoiceSearch', {
      detail: { invoiceNumber: parseInt(invoice) }
    });
    window.dispatchEvent(searchEvent);
  };

  const handleDriverSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDriverName = e.target.value;
    setSelectedDriver(selectedDriverName);

    // Emit custom event for driver selection
    const driverSelectEvent = new CustomEvent('driverSelect', {
      detail: { driverName: selectedDriverName }
    });
    window.dispatchEvent(driverSelectEvent);
  };

  return (
    <nav
      style={{
        padding: "1rem",
        background: "#eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h1 style={{ margin: 0 }}>Delivery Map System</h1>
        <p style={{ fontSize: "0.9rem", color: "#555", margin: 0 }}>
          🟥 Red pin: Delivery points | 🔵 Blue pin: Warehouse & Customer Service | 🟢 Green circle: Driver's location
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Search Area */}
        <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search Invoice..."
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              marginRight: "0.5rem",
            }}
          />
          <button type="submit" style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            🔍
          </button>
        </form>

        {/* Driver Selection */}
        <select
          value={selectedDriver}
          onChange={handleDriverSelect}
          style={{ padding: "0.5rem", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          <option value="">Select Driver</option>
          {drivers.map((driver: { id: string; name: string }) => (
            <option key={driver.id} value={driver.name}>
              {driver.name} (ID: {driver.id})
            </option>
          ))}
        </select>

        {/* Navigation Links */}
        {/* <Link to="/authenticate">Authenticate</Link> */}
      </div>
    </nav>
  );
};

export default Navbar;
