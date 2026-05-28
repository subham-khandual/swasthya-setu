import API_BASE_URL from '../apiConfig';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?._id || user?.userId;

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/notifications/${userId}`);
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            // Fallback mock data for demo if API fails
            const mockData = [
                {
                    _id: '1',
                    type: 'appointment',
                    title: 'Appointment Confirmed',
                    message: 'Your appointment at Apollo Hospitals has been confirmed for tomorrow at 10:00 AM.',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
                },
                {
                    _id: '2',
                    type: 'blood_request',
                    title: 'Urgent Blood Request',
                    message: 'Someone near you needs O+ blood urgently. Can you help?',
                    isRead: true,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
                },
                {
                    _id: '3',
                    type: 'emergency',
                    title: 'Emergency Alert',
                    message: 'Minor accident reported nearby. Stay safe!',
                    isRead: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
                }
            ];
            setNotifications(mockData);
            setUnreadCount(mockData.filter(n => !n.isRead).length);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchNotifications();
        
        // Optional: Poll for new notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking read:", err);
            // Local update for demo
            setNotifications(prev => 
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllRead = async () => {
        if (!userId) return;
        try {
            await axios.put(`${API_BASE_URL}/api/notifications/user/${userId}/read-all`);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Error marking all read:", err);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/notifications/${id}`);
            const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Error deleting notification:", err);
            const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }
    };

    const addNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            loading, 
            fetchNotifications, 
            markAsRead, 
            markAllRead,
            deleteNotification,
            addNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
