"use client"

import { useState, useEffect } from 'react';
import { 
  Home, Network, Smartphone, BarChart2, Filter, Bell, ClipboardList, 
  LogOut, Menu, X, Settings, Wifi, AlertTriangle
} from 'lucide-react';
import { auth } from "../pages/auth/firebase";
import { signOut } from 'firebase/auth';
import axios from 'axios';
import image from '../images/a35.jpg';

const Sidebar = () => {
  const [active, setActive] = useState('Dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('online'); // 'online', 'offline', 'slow'
  const [networkRetries, setNetworkRetries] = useState(0);
  const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState(null);

  // Initialize lastCheckedTimestamp from localStorage after component mounts
  useEffect(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('lastCheckedNotifications');
    setLastCheckedTimestamp(saved ? new Date(saved).toISOString() : new Date().toISOString());
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [ 
    { name: "Dashboard", route: "pages/dashboard", icon: <Home size={20} /> },
    { name: "Network Status", route: "pages/dashboard/network", icon: <Network size={20} /> },
    { name: "Connected Devices", route: "pages/dashboard/connectedDevices", icon: <Smartphone size={20} /> },
    { name: "Bandwidth Usage", route: "pages/dashboard/bandwidth", icon: <BarChart2 size={20} /> },
    { name: "Mac Filtering", route: "pages/dashboard/macfilter", icon: <Filter size={20} /> },
    { 
      name: "Notifications", 
      route: "pages/dashboard/notification", 
      icon: <Bell size={20} />,
      hasBadge: unreadNotifications > 0,
      badgeCount: unreadNotifications
    },
    { name: "Logs", route: "pages/dashboard/logs", icon: <ClipboardList size={20} /> },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      console.log("User logged out successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const onComponentChange = (route) => {
    console.log(route);
    
    // If navigating to notifications, update the last checked timestamp
    if (route === "notifications") {
      const now = new Date().toISOString();
      setLastCheckedTimestamp(now);
      localStorage.setItem('lastCheckedNotifications', now);
      setUnreadNotifications(0);
    }
    
    // Check if we're in offline mode
    if (connectionStatus === 'offline') {
      // Show network warning
      alert('You are currently offline. Some features may not be available.');
    }
    
    window.location.href = `/${route}`;
  };

  // Check for network status and handle poor connectivity
  const checkNetworkStatus = () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setConnectionStatus('offline');
      return;
    }

    // Test network speed by timing a small request
    const startTime = new Date().getTime();
    
    fetch('http://localhost:8005/api/ping', { 
      method: 'GET',
      cache: 'no-cache'
    })
    .then(response => {
      const endTime = new Date().getTime();
      const responseTime = endTime - startTime;
      
      // If response time is slow (> 2000ms), mark as slow connection
      if (responseTime > 2000) {
        setConnectionStatus('slow');
      } else {
        setConnectionStatus('online');
      }
      
      // Reset retry counter on success
      setNetworkRetries(0);
    })
    .catch(error => {
      console.error("Network check failed:", error);
      
      // Increment retry counter
      const newRetryCount = networkRetries + 1;
      setNetworkRetries(newRetryCount);
      
      // After 3 failed attempts, mark as offline
      if (newRetryCount >= 3) {
        setConnectionStatus('offline');
      } else {
        setConnectionStatus('slow');
      }
    });
  };

  // Fetch notifications and check for new ones with retry logic
  const checkForNewNotifications = async () => {
    if (connectionStatus === 'offline' || !lastCheckedTimestamp) {
      console.log("Skipping notification check - device is offline or timestamp not initialized");
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await axios.get('http://localhost:8005/api/notifications', {
        signal: controller.signal,
        // Retry and timeout options
        timeout: 5000,
        retries: 2,
        retryDelay: 1000
      });
      
      clearTimeout(timeoutId);
      
      // Count notifications that came after the last checked timestamp
      const newNotifications = response.data.filter(
        notification => new Date(notification.created_at) > new Date(lastCheckedTimestamp)
      );
      
      setUnreadNotifications(newNotifications.length);
      
      // Successfully fetched, update network status if it was slow
      if (connectionStatus === 'slow') {
        setConnectionStatus('online');
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      
      // Network error handling
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setConnectionStatus('slow');
      } else if ((typeof navigator !== 'undefined' && !navigator.onLine) || error.message.includes('Network Error')) {
        setConnectionStatus('offline');
      }
    }
  };

  // Setup polling for network status and notifications
  useEffect(() => {
    // Skip if not in browser environment or lastCheckedTimestamp not yet initialized
    if (typeof window === 'undefined' || !lastCheckedTimestamp) {
      return;
    }
    
    // Initial checks
    checkNetworkStatus();
    checkForNewNotifications();
    
    // Check network status every 30 seconds
    const networkIntervalId = setInterval(checkNetworkStatus, 30000);
    
    // Check for notifications (adaptive interval based on connection)
    const notifIntervalId = setInterval(() => {
      // Check less frequently if connection is slow
      if (connectionStatus === 'slow' && Date.now() % 2 === 0) {
        return;
      }
      checkForNewNotifications();
    }, connectionStatus === 'slow' ? 60000 : 30000);
    
    // Listen for online/offline events
    window.addEventListener('online', () => setConnectionStatus('online'));
    window.addEventListener('offline', () => setConnectionStatus('offline'));
    
    // Clean up on unmount
    return () => {
      clearInterval(networkIntervalId);
      clearInterval(notifIntervalId);
      window.removeEventListener('online', () => setConnectionStatus('online'));
      window.removeEventListener('offline', () => setConnectionStatus('offline'));
    };
  }, [lastCheckedTimestamp, connectionStatus]);

  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    const currentRoute = window.location.pathname.replace('/', '');
    const activeItem = menuItems.find(item => item.route === currentRoute);
    if (activeItem) {
      setActive(activeItem.name);
      
      // If on notifications page, reset the unread count and update last checked time
      if (currentRoute === "notifications") {
        const now = new Date().toISOString();
        setLastCheckedTimestamp(now);
        localStorage.setItem('lastCheckedNotifications', now);
        setUnreadNotifications(0);
      }
    }
  }, [menuItems]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    const handleClickOutside = (event) => {
      const sidebarEl = document.querySelector('.sidebar');
      const toggleBtnEl = document.querySelector('.toggle-button');
      
      if (isOpen && 
          sidebarEl && 
          !sidebarEl.contains(event.target) && 
          toggleBtnEl && 
          !toggleBtnEl.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Detect screen size changes for responsive behavior
  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !isOpen) {
        setIsOpen(true);
      } else if (window.innerWidth < 1024 && isOpen) {
        setIsOpen(false);
      }
    };

    // Set initial state based on screen size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Toggle button - fixed position outside the sidebar for mobile */}
      <button 
        className="toggle-button fixed top-4 left-4 z-30 lg:hidden bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
      </button>
      
      {/* Main sidebar - fixed on desktop, slide in/out on mobile */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-30 overflow-y-auto
                  transition-all duration-300 ease-in-out
                  ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'} 
                  lg:static lg:shadow-none`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo and app name */}
          <div className={`flex items-center justify-center mb-8 transition-all duration-300 ${!isOpen && 'lg:justify-center'}`}>
            <div className="relative w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-2">
              <Wifi size={22} />
              {connectionStatus === 'offline' && (
                <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 border-2 border-white"></div>
              )}
              {connectionStatus === 'slow' && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-4 h-4 border-2 border-white"></div>
              )}
            </div>
            <h2 className={`text-xl font-bold text-gray-700 transition-opacity duration-300 ${!isOpen && 'lg:hidden'}`}>NetDetect</h2>
          </div>
          
          {/* Connection status indicator */}
          <div className={`mb-4 px-2 py-1.5 rounded-lg 
                         ${connectionStatus === 'online' ? 'bg-green-100 text-green-700' : 
                           connectionStatus === 'slow' ? 'bg-yellow-100 text-yellow-700' : 
                           'bg-red-100 text-red-700'}
                         ${!isOpen && 'lg:hidden'}`}>
            <div className="flex items-center justify-center gap-2">
              {connectionStatus === 'online' ? (
                <Wifi size={16} className="text-green-500" />
              ) : connectionStatus === 'slow' ? (
                <AlertTriangle size={16} className="text-yellow-500" />
              ) : (
                <AlertTriangle size={16} className="text-red-500" />
              )}
              <span className="text-xs font-medium">
                {connectionStatus === 'online' ? 'Online' : 
                 connectionStatus === 'slow' ? 'Slow Connection' : 
                 'Offline Mode'}
              </span>
            </div>
          </div>
          
          {/* Navigation menu */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li 
                  key={item.name} 
                  onClick={() => {
                    setActive(item.name);
                    onComponentChange(item.route);
                  }}
                  className={`flex items-center rounded-lg cursor-pointer transition-all duration-300
                            ${active === item.name 
                              ? "bg-indigo-100 text-indigo-700 font-medium" 
                              : "hover:bg-gray-100 text-gray-600"}
                            ${isOpen ? 'p-3' : 'p-3 lg:p-2 lg:justify-center'}`}
                  title={!isOpen ? item.name : ''}
                >
                  <span className="relative">
                    {item.icon}
                    {/* Notification badge */}
                    {item.hasBadge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {item.badgeCount > 9 ? '9+' : item.badgeCount}
                      </span>
                    )}
                  </span>
                  <span className={`ml-3 transition-opacity duration-300 ${!isOpen && 'lg:hidden'}`}>
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User profile and logout */}
          <div className={`flex flex-col items-center mt-4 pb-4 border-t border-gray-200 pt-4 
                         ${!isOpen && 'lg:pt-2'}`}>
            <div className="relative">
              <img 
                src={image}
                alt="Profile" 
                className={`rounded-full border-2 border-gray-200 shadow-sm transition-all duration-300
                           ${isOpen ? 'w-14 h-14' : 'w-10 h-10'}`}
              />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                             ${connectionStatus === 'online' ? 'bg-green-500' : 
                               connectionStatus === 'slow' ? 'bg-yellow-500' : 
                               'bg-red-500'}`}></div>
            </div>
            <span className={`mt-2 text-sm font-semibold text-gray-700 transition-opacity duration-300
                           ${!isOpen && 'lg:hidden'}`}>
              Joel
            </span>
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Log out"
              className={`flex items-center text-red-500 hover:text-red-600 transition-all duration-300
                         ${isOpen ? 'mt-3 px-3 py-1.5 hover:bg-red-50 rounded-md' : 'mt-4 lg:mt-4'}`}
              title={!isOpen ? "Log Out" : ''}
            >
              <LogOut size={isOpen ? 16 : 20} />
              <span className={`ml-2 transition-opacity duration-300 ${!isOpen && 'lg:hidden'}`}>
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;