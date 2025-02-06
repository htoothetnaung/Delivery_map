import { useState, useEffect } from "react";
import { api, Report } from "../services/api";

const AdminPanel = () => {
    const [reports, setReports] = useState<Report[]>([]);
  
    // Fetch reports
    useEffect(() => {
      const loadReports = async () => {
        const response = await api.getReports();
        setReports(response.data);
      };
      loadReports();
    }, []);
  
    // Update report status
    const handleStatusUpdate = async (id: number, status: string) => {
      await api.updateReport(id, status);
      const response = await api.getReports();
      setReports(response.data);
    };
  
    return (
      <div className="admin-panel">
        <h2>🗂️ Reported Cases</h2>
        <div className="report-list">
          {reports.map((report) => (
            <div key={report.id} className="report-item">
              <p>{report.description}</p>
              <div className="report-actions">
                <button onClick={() => report.id !== undefined && handleStatusUpdate(report.id, 'approved')}>
                  ✅ Approve
                </button>
                <button onClick={() => report.id !== undefined && handleStatusUpdate(report.id, 'rejected')}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  export default AdminPanel;