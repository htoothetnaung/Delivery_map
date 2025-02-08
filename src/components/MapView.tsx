/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api, Report, Shelter, Delivery } from '../services/api';
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

// Add Green Icon for driver location
const GreenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Add Purple Icon for deliveries
const PurpleIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RouteInfo {
  deliveryId: number;
  shopName: string;
  totalTime: number;
  reports: Array<{
    description: string;
    distance: number;
  }>;
}

const MapView = () => {
  const [position, setPosition] = useState<[number, number]>([16.8397, 96.1444]);
  const [reports, setReports] = useState<Report[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [formType, setFormType] = useState<'shelter' | 'report' | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [travelTime, setTravelTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<[number, number][]>([]);
  const [totalTravelTime, setTotalTravelTime] = useState<number | null>(null);

  const [optimizedWaypoints, setOptimizedWaypoints] = useState<any[]>([]);
  const [routeSegments, setRouteSegments] = useState<Array<[number, number][]>>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  //  for calculation optimal delivery roy
  const [deliveryRoutes, setDeliveryRoutes] = useState<{ [key: number]: [number, number][] }>({}); // Store routes for each delivery

  const [routeInfos, setRouteInfos] = useState<RouteInfo[]>([]);
  const [isInfoMinimized, setIsInfoMinimized] = useState(false);


  // Fetch initial data
  useEffect(() => {
    api.getShelters().then((res) => setShelters(res.data));
    api.getReports().then((res) => setReports(res.data));
    api.getDeliveries().then((res) => setDeliveries(res.data));
  }, []);

  // Add new function to calculate optimized route

  const calculateOptimizedRoute = async () => {
    if (!userLocation || reports.length === 0) {
      alert('Please enable location services and ensure there are reports to visit.');
      return;
    }

    setIsLoading(true);
    try {
      let coordinates = `${userLocation[1]},${userLocation[0]}`;
      reports.forEach(report => {
        coordinates += `;${report.lng},${report.lat}`;
      });

      // Get optimized trip order
      const tripResponse = await axios.get(
        `https://router.project-osrm.org/trip/v1/driving/${coordinates}?roundtrip=false&source=first`
      );

      const { trips, waypoints } = tripResponse.data;

      if (trips && trips.length > 0) {
        const sortedWaypoints = waypoints.sort((a: any, b: any) => a.waypoint_index - b.waypoint_index);
        setOptimizedWaypoints(sortedWaypoints);

        // Calculate route segments between consecutive waypoints
        const segments: Array<[number, number][]> = [];
        for (let i = 0; i < sortedWaypoints.length - 1; i++) {
          const start = sortedWaypoints[i];
          const end = sortedWaypoints[i + 1];

          // Get detailed route between consecutive points
          const routeResponse = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/${start.location[0]},${start.location[1]};${end.location[0]},${end.location[1]}?overview=full`
          );

          if (routeResponse.data.routes[0]) {
            const decodedSegment = decodePolyline(routeResponse.data.routes[0].geometry);
            segments.push(decodedSegment);
          }
        }

        setRouteSegments(segments);
        setTotalTravelTime(Math.round(trips[0].duration / 60));

        // Create waypoint order message
        const waypointOrder = sortedWaypoints.map((wp: any, index: number) => {
          if (index === 0) return "Driver Start";
          const report = reports[index - 1];
          return `Stop ${index}: ${report.description.substring(0, 20)}...`;
        });

        alert(`Optimized Route Created!\n\nTotal travel time: ${Math.round(trips[0].duration / 60)} minutes\n\nRoute order:\n${waypointOrder.join('\n')}`);
      }
    } catch (error) {
      console.error('Failed to calculate optimized route:', error);
      alert('Failed to calculate optimized route. Please try again.');
    }
    setIsLoading(false);
  };


  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDeliveryRoutes = async () => {
    setIsLoading(true);
    try {
      let availableReports = [...reports];
      const routeInformation: RouteInfo[] = [];
      const clusters: Array<Report[]> = [];

      // Define region centers based on the map's geographical areas
      const regionCenters = [
        { lat: 16.8397, lng: 96.1444 }, // Downtown/South
        { lat: 16.8597, lng: 96.1644 }, // Central/East
        { lat: 16.8497, lng: 96.1244 }, // West
        { lat: 16.8797, lng: 96.1544 }  // North
      ];

      // Initialize clusters for each delivery
      deliveries.forEach(() => clusters.push([]));

      // First pass: Ensure each delivery gets at least 4 reports
      for (let i = 0; i < deliveries.length && availableReports.length > 0; i++) {
        const center = regionCenters[i];

        // Get 4 closest reports to this region center
        while (clusters[i].length < 4 && availableReports.length > 0) {
          // Find closest report to current center
          let closestReport = availableReports[0];
          let shortestDistance = calculateDistance(
            closestReport.lat,
            closestReport.lng,
            center.lat,
            center.lng
          );

          availableReports.forEach(report => {
            const distance = calculateDistance(
              report.lat,
              report.lng,
              center.lat,
              center.lng
            );
            if (distance < shortestDistance) {
              shortestDistance = distance;
              closestReport = report;
            }
          });

          // Add closest report to cluster
          clusters[i].push(closestReport);
          availableReports = availableReports.filter(r => r.id !== closestReport.id);
        }
      }

      // Second pass: Distribute any remaining reports to nearest clusters
      while (availableReports.length > 0) {
        const report = availableReports[0];
        let nearestClusterIndex = 0;
        let shortestDistance = Infinity;

        regionCenters.forEach((center, index) => {
          if (index >= clusters.length) return;

          const distance = calculateDistance(
            report.lat,
            report.lng,
            center.lat,
            center.lng
          );

          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestClusterIndex = index;
          }
        });

        clusters[nearestClusterIndex].push(report);
        availableReports = availableReports.filter(r => r.id !== report.id);
      }

      // Calculate routes for each cluster in parallel
      const routePromises = clusters.map(async (cluster, index) => {
        if (!cluster.length || index >= deliveries.length) return null;
        const delivery = deliveries[index];

        let coordinates = `${delivery.lng},${delivery.lat}`;
        cluster.forEach(report => {
          coordinates += `;${report.lng},${report.lat}`;
        });

        try {
          const response = await axios.get(
            `https://router.project-osrm.org/trip/v1/driving/${coordinates}?roundtrip=true&source=first`
          );

          if (response.data.trips && response.data.trips.length > 0) {
            return {
              deliveryId: delivery.id,
              route: decodePolyline(response.data.trips[0].geometry),
              info: {
                deliveryId: delivery.id,
                shopName: delivery.shopName[0],
                totalTime: Math.round(response.data.trips[0].duration / 60),
                reports: cluster.map(r => ({
                  description: r.description,
                  distance: calculateDistance(delivery.lat, delivery.lng, r.lat, r.lng)
                }))
              }
            };
          }
        } catch (error) {
          console.error(`Failed to calculate route for delivery ${delivery.id}:`, error);
          return null;
        }
      });

      // Wait for all route calculations to complete
      const results = await Promise.all(routePromises);
      const deliveryRoutesMap: { [key: number]: [number, number][] } = {};

      results.forEach(result => {
        if (result) {
          deliveryRoutesMap[result.deliveryId] = result.route;
          routeInformation.push(result.info);
        }
      });

      setDeliveryRoutes(deliveryRoutesMap);
      setRouteInfos(routeInformation);
      setIsInfoMinimized(false);

    } catch (error) {
      console.error('Failed to calculate delivery routes:', error);
      alert('Failed to calculate delivery routes. Please try again.');
    }
    setIsLoading(false);
  };

  // Modified user location handling
  useEffect(() => {
    // Try to get user location when component mounts
    handleGetUserLocation();
  }, []); // Run once on component mount

  // Updated location handler
  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition: [number, number] = [latitude, longitude];
          setUserLocation(newPosition);
          setPosition(newPosition);
          // Add a marker for user's location
          const marker = L.marker(newPosition, {
            icon: DefaultIcon,
          }).bindPopup('You are here');
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert(`Location error: ${error.message}`);
        },
        {
          enableHighAccuracy: true, // Request high accuracy
          timeout: 5000, // Time to wait for location
          maximumAge: 0 // Don't use cached position
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
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
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${to[1]},${to[0]}?overview=full`
      );

      // Get the decoded polyline
      const geometry = response.data.routes[0].geometry;
      const decodedPolyline = decodePolyline(geometry);

      // Set the route and travel time
      setRoutePolyline(decodedPolyline);
      setTravelTime(Math.round(response.data.routes[0].duration / 60));
    } catch (error) {
      alert('Failed to get travel time.');
      setRoutePolyline([]);
      setTravelTime(null);
    }
  };
  // Updated polyline decoder function
  const decodePolyline = (encoded: string): [number, number][] => {
    const poly: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    const len = encoded.length;

    while (index < len) {
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        const b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      // Decode longitude
      shift = 0;
      result = 0;

      do {
        const b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      // Important: OSRM returns coordinates as [longitude, latitude]
      // But Leaflet expects [latitude, longitude]
      poly.push([lat * 1e-5, lng * 1e-5]);
    }

    return poly;
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
      <button onClick={handleGetUserLocation} style={{ position: 'absolute', zIndex: 1000, margin: '10px', left: '40px' }} disabled={isLoading}>
        {isLoading ? 'Getting Location...' : '📍 Locate Driver'}
      </button>

      {/* Replace optimize route button with new delivery routes button */}
      <button
        onClick={calculateDeliveryRoutes}
        style={{
          position: 'absolute',
          zIndex: 1000,
          margin: '10px',
          left: '150px',
        }}
        disabled={isLoading}
      >
        {isLoading ? 'Calculating Routes...' : '🚗 Calculate Delivery Routes'}
      </button>

      {/* Add new button for route optimization */}
      {userLocation && reports.length > 0 && (
        <button
          onClick={calculateOptimizedRoute}
          style={{
            position: 'absolute',
            zIndex: 1000,
            margin: '10px',
            left: '350px',
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating Route...' : '🚗 Optimize Route'}
        </button>
      )}


      {/* Route Information Popup */}
      {routeInfos.length > 0 && (
        <div
          style={{
            position: 'absolute',
            right: isInfoMinimized ? '20px' : '50px',
            bottom: isInfoMinimized ? '20px' : '50px',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxWidth: isInfoMinimized ? '60px' : '400px',
            maxHeight: isInfoMinimized ? '60px' : '80vh',
            overflow: 'auto',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onClick={() => isInfoMinimized && setIsInfoMinimized(false)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Delivery Routes</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsInfoMinimized(!isInfoMinimized);
              }}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '5px',
              }}
            >
              {isInfoMinimized ? '🔍' : '➖'}
            </button>
          </div>

          {!isInfoMinimized && (
            <div>
              {routeInfos.map((info) => (
                <div
                  key={info.deliveryId}
                  style={{
                    marginBottom: '20px',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '5px',
                  }}
                >
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    Delivery {info.deliveryId} ({info.shopName})
                  </h4>
                  <p><strong>Total Time:</strong> {info.totalTime} minutes</p>
                  <p><strong>Assigned Reports:</strong></p>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {info.reports.map((report, index) => (
                      <li key={index}>
                        {report.description} ({report.distance} km)
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {isInfoMinimized && (
            <div style={{ textAlign: 'center' }}>
              📋
            </div>
          )}
        </div>
      )}


      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler />


        {/* Add Driver Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={GreenIcon}>
            <Popup>
              <strong>Driver Location</strong>
            </Popup>
          </Marker>
        )}



        {/* Route segments with different colors */}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={index}
            positions={segment}
            color={`hsl(${(index * 137) % 360}, 70%, 50%)`}
            weight={4}
            opacity={0.8}
          >
            <Popup>
              Segment {index + 1}
            </Popup>
          </Polyline>
        ))}

        {/* Numbered lines for optimized waypoints */}

        {optimizedWaypoints.length > 0 && (
          <>
            {optimizedWaypoints.map((waypoint: any, index: number) => {
              // Skip the first waypoint (driver's location) as it does not need a marker
              if (index > 0) {
                const startPoint = optimizedWaypoints[index - 1].location; // previous waypoint
                const endPoint = waypoint.location; // current waypoint

                // Add a Polyline for the segment between consecutive waypoints
                return (
                  <Polyline
                    key={`optimized-segment-${index}`}
                    positions={[
                      [startPoint[1], startPoint[0]], // Convert to [lat, lng]
                      [endPoint[1], endPoint[0]], // Convert to [lat, lng]
                    ]}
                    color="blue"
                    weight={4}
                    opacity={0.8}
                  >
                    <Popup>
                      <strong>Route Segment {index}</strong>
                      <br />
                      From: {reports[index - 1]?.description || 'Driver Location'}
                      <br />
                      To: {reports[index]?.description}
                    </Popup>
                  </Polyline>
                );
              }
              return null;
            })}
          </>
        )}
        {/* Update shelter markers to show travel time */}
        {shelters.map((shelter) => (
          <Marker key={shelter.id} position={[shelter.lat, shelter.lng]} icon={DefaultIcon}>
            <Popup>
              <h4>{shelter.name}</h4>
              <p>Contact: {shelter.contact}</p>
              <button onClick={() => calculateTravelTime([shelter.lat, shelter.lng])}>
                🚗 Get Directions
              </button>
              {travelTime && userLocation &&
                shelter.lat === routePolyline[routePolyline.length - 1]?.[0] &&
                shelter.lng === routePolyline[routePolyline.length - 1]?.[1] && (
                  <p style={{ marginTop: '10px', color: '#0066cc' }}>
                    Estimated travel time: {travelTime} minutes
                  </p>
                )}
            </Popup>
          </Marker>
        ))}

        {/* Add Delivery Markers */}
        {deliveries.map((delivery) => (
          <Marker
            key={`delivery-${delivery.id}`}
            position={[delivery.lat, delivery.lng]}
            icon={PurpleIcon}
          >
            <Popup>
              <div>
                <h4>Delivery #{delivery.id}</h4>
                <p><strong>Driver:</strong> {delivery.driverName}</p>
                <p><strong>Contact:</strong> {delivery.driverContact}</p>
                <p><strong>Status:</strong> {delivery.status}</p>
                <p><strong>Deliveries:</strong></p>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {delivery.invoiceNum.map((invoice, index) => (
                    <li key={invoice}>
                      Invoice #{invoice} - {delivery.shopName[index]}
                    </li>
                  ))}
                </ul>
                {userLocation && (
                  <button onClick={() => calculateTravelTime([delivery.lat, delivery.lng])}>
                    🚗 Get Directions
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Add delivery points with different colors */}
        {Object.entries(deliveryRoutes).map(([deliveryId, route]) => (
          <Polyline
            key={`route-${deliveryId}`}
            positions={route}
            color={`hsl(${(parseInt(deliveryId) * 137) % 360}, 70%, 50%)`}
            weight={4}
            opacity={0.8}
          >
            <Popup>
              Delivery Route {deliveryId}
              <br />
              {deliveries.find(d => d.id === parseInt(deliveryId))?.shopName[0]}
            </Popup>
          </Polyline>
        ))}

        {reports.map((report) => (
          <Marker key={report.id} position={[report.lat, report.lng]} icon={RedIcon}>
            <Popup>{report.description}</Popup>
          </Marker>
        ))}

        {/* Add polylines connecting deliveries to their reports */}
        {routeInfos.map((info) => (
          <React.Fragment key={`delivery-lines-${info.deliveryId}`}>
            {info.reports.map((report, index) => {
              const delivery = deliveries.find(d => d.id === info.deliveryId);
              if (!delivery) return null;

              return (
                <Polyline
                  key={`delivery-${info.deliveryId}-report-${index}`}
                  positions={[
                    [delivery.lat, delivery.lng], // Delivery location
                    [reports.find(r => r.description === report.description)?.lat || 0,
                    reports.find(r => r.description === report.description)?.lng || 0] // Report location
                  ]}
                  color={`hsl(${(info.deliveryId * 137) % 360}, 70%, 50%)`}
                  weight={5}
                  opacity={1}

                >
                  <Popup>
                    <strong>Delivery Route {info.deliveryId}</strong>
                    <br />
                    From: {info.shopName}
                    <br />
                    To: {report.description}
                    <br />
                    Distance: {report.distance.toFixed(2)} km
                  </Popup>
                </Polyline>
              );
            })}
          </React.Fragment>
        ))}



      </MapContainer>


      {/* Show total travel time if available */}
      {totalTravelTime && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          <strong>Total Route Time:</strong> {totalTravelTime} minutes
        </div>
      )}



    </div>
  );
};

export default MapView;