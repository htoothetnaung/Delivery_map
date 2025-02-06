import { useState, useEffect } from "react";
import { api } from "../services/api";



const NotificationList = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifications, setNotifications] = useState<any[]>([]);
  
    // Fetch notifications
    useEffect(() => {
      const fetchNotifications = async () => {
        const response = await api.getNotifications();
        setNotifications(response.data);
      };
      fetchNotifications();
    }, []);
  
    return (
      <div className="notification-sidebar">
        <h3>🔔 Notifications</h3>
        {notifications.map((notification) => (
          <div key={notification.id} className="notification-item">
            <p>{notification.message}</p>
            <small>{new Date(notification.date).toLocaleString()}</small>
          </div>
        ))}
      </div>
    );
  };

  export default NotificationList;