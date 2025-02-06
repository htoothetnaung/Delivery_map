/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api, Report, Shelter } from '../services/api';
import axios from 'axios';
import L from 'leaflet';

// Fix Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = () => {
  const [position, setPosition] = useState<[number, number]>([16.8397, 96.1444]);
  const [reports, setReports] = useState<Report[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [formType, setFormType] = useState<'shelter' | 'report' | null>(null);

  // Fetch initial data
  useEffect(() => {
    api.getShelters().then((res) => setShelters(res.data));
    api.getReports().then((res) => setReports(res.data));
  }, []);

  // Get user location
  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setPosition([latitude, longitude]);
        },
        (error) => alert('Unable to retrieve location.')
      );
    } else {
      alert('Geolocation not supported.');
    }
  };

  // Calculate travel time
  const calculateTravelTime = async (to: [number, number]) => {
    if (!userLocation) {
      alert('Please enable location services first.');
      return;
    }
    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${to[1]},${to[0]}?overview=false`
      );
      alert(`Travel time: ${Math.round(response.data.routes[0].duration / 60)} minutes`);
    } catch (error) {
      alert('Failed to get travel time.');
    }
  };

  // Handle map clicks
  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        setSelectedPosition([e.latlng.lat, e.latlng.lng]);
        setShowForm(true);
        setFormType(null);
      },
    });
    return null;
  }

  // Handle form submission move to under with direct encoding with ui

  return (
    <div style={{ height: '90vh', width: '100%' }}>
      <button onClick={handleGetUserLocation} style={{ position: 'absolute', zIndex: 1000, margin: '10px' }}>
        📍 Enable My Location
      </button>
      <button onClick={() => { setShowForm(false); setSelectedPosition(null); }} style={{ position: 'absolute', zIndex: 1000, margin: '50px' }}>
        📌 Report on Map
      </button>

      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler />
 {/* Rendering stored shelters and reports from db.json */}
        {shelters.map((shelter) => (
          <Marker key={shelter.id} position={[shelter.lat, shelter.lng]} icon={DefaultIcon}>
            <Popup>
              <h4>{shelter.name}</h4>
              <p>Contact: {shelter.contact}</p>
              <button onClick={() => calculateTravelTime([shelter.lat, shelter.lng])}>🚗 Get Directions</button>
            </Popup>
          </Marker>
        ))}

        {reports.map((report) => (
          <Marker key={report.id} position={[report.lat, report.lng]} icon={RedIcon}>
            <Popup>{report.description}</Popup>
          </Marker>
        ))}
{/*  Report on Map Feature  */}
{selectedPosition && (
  <Marker position={selectedPosition} icon={RedIcon}>
    <Popup>
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent map click event
          setFormType('report');
          setShowForm(true);
        }}
      >
        📢 Report Issue
      </button>
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent map click event
          setFormType('shelter');
          setShowForm(true);
        }}
      >
        🏠 Add Shelter
      </button>
      
      <button
        onClick={(e) => {
            e.stopPropagation(); 
            setSelectedPosition(null);
            setShowForm(false);
        }}
        style={{marginTop: '10px',background: '#ff4444',color: 'white',cursor: 'pointer'}}

      >
        ❌ Cancel
      </button>
    </Popup>
  </Marker>
)}
      </MapContainer>

{/* This is Form for Report on Map to choose report or shelter */}

{showForm && selectedPosition && formType && (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000, // Ensure it's on top of the map
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      width: '300px',
    }}
  >
    <h3>{formType === 'report' ? 'Report Issue' : 'Add Shelter'}</h3>
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);

        if (formType === 'report') {
          const newReport: Report = {
            lat: selectedPosition[0],
            lng: selectedPosition[1],
            description: data.get('description') as string,
            petType: 'lost',
            status: 'pending',
            pending: '',
          };
          try {
            const res = await api.submitReport(newReport);
            setReports([...reports, res.data]);
          } catch (error) {
            console.error('Failed to submit report:', error);
            alert('Failed to submit report.');
          }
        } else if (formType === 'shelter') {
          const newShelter: Shelter = {
            id: Date.now(),
            lat: selectedPosition[0],
            lng: selectedPosition[1],
            name: data.get('name') as string,
            contact: data.get('contact') as string,
          };
          try {
            const res = await api.submitShelter(newShelter);
            setShelters([...shelters, res.data]);
          } catch (error) {
            console.error('Failed to submit shelter:', error);
            alert('Failed to submit shelter.');
          }
        }

        setShowForm(false);
        setFormType(null);
        setSelectedPosition(null);
      }}
    >
      {formType === 'report' && (
        <textarea
          name="description"
          placeholder="Describe the issue..."
          required
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
      )}
      {formType === 'shelter' && (
        <>
          <input
            name="name"
            placeholder="Shelter Name"
            required
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <input
            name="contact"
            placeholder="Contact"
            required
            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          />
        </>
      )}
      <button
        type="submit"
        style={{
          marginRight: '10px',
          padding: '8px 12px',
          border: 'none',
          borderRadius: '4px',
          background: '#007bff',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Submit
      </button>
      <button
        type="button"
        onClick={() => {
          setShowForm(false);
          setFormType(null);
          setSelectedPosition(null);
        }}
        style={{
          padding: '8px 12px',
          border: 'none',
          borderRadius: '4px',
          background: '#6c757d',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </form>
  </div>
)}
    </div>
  );
};

export default MapView;