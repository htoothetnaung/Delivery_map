import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export interface Report {
  id?: number;
  lat: number;
  lng: number;
  description: string;
  petType: 'lost' | 'injured';
  status: string;
  pending: string;
}

export interface Shelter {
  id: number;
  name: string;
  lat: number;
  lng: number;
  contact: string;
}

export const api = {
  // Reports
  getReports: () => axios.get<Report[]>(`${API_BASE}/reports`),
  submitReport: (report: Report) => axios.post<Report>(`${API_BASE}/reports`, report),
  updateReport: (id: number, status: string) =>
    axios.patch(`${API_BASE}/reports/${id}`, { status }),

  // Shelters
  getShelters: () => axios.get<Shelter[]>(`${API_BASE}/shelters`),
  submitShelter: (shelter: Shelter) => axios.post<Shelter>(`${API_BASE}/shelters`, shelter),

  // Notifications
  getNotifications: () => axios.get(`${API_BASE}/notifications`),
};