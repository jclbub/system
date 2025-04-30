"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import Sidebar from "../../components/Sidebar";

const Dashboard = () => {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [blockedDevices, setBlockedDevices] = useState([]);
  const [bandwidthUsage, setBandwidthUsage] = useState(null);
  const [speedTest, setSpeedTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connectedRes, blockedRes, bandwidthRes, speedRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/connected-devices'),
          axios.get('http://127.0.0.1:8001/blocked-devices'),
          axios.get('http://127.0.0.1:8000/total-bandwidth-usage'),
          axios.get('http://127.0.0.1:8000/speed-test')
        ]);

        setConnectedDevices(connectedRes.data);
        setBlockedDevices(blockedRes.data);
        setBandwidthUsage(bandwidthRes.data);
        setSpeedTest(speedRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Process speed test data for the line chart
  const getSpeedHistoryData = () => {
    if (!speedTest) return [];
    
    const upBandwidthHistory = speedTest.upbandwidthhistory?.split(',').map(Number) || [];
    const downBandwidthHistory = speedTest.downbandwidthhistory?.split(',').map(Number) || [];
    const bandwidthTime = speedTest.bandwidthtime?.split(',').map(Number) || [];
    
    return upBandwidthHistory.map((up, index) => ({
      time: bandwidthTime[index] || index,
      upload: up,
      download: downBandwidthHistory[index] || 0
    }));
  };

  // Process connected devices data for the bar chart
  const getConnectedDevicesData = () => {
    if (!Array.isArray(connectedDevices)) return [];
    
    // Count device types
    const deviceTypeCounts = connectedDevices.reduce((acc, device) => {
      const type = device.DeviceType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(deviceTypeCounts).map(([type, count]) => ({
      type,
      count
    }));
  };

  // Process bandwidth usage for pie chart
  const getBandwidthPieData = () => {
    if (!bandwidthUsage) return [];
    
    const uploadMB = parseFloat(bandwidthUsage.total_upload_MB) || 0;
    const downloadMB = parseFloat(bandwidthUsage.total_download_MB) || 0;
    
    return [
      { name: 'Upload', value: uploadMB },
      { name: 'Download', value: downloadMB }
    ];
  };

  // Generate colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <div className="flex justify-center items-center h-screen">Loading dashboard data...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">Network Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connected Devices Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Connected Devices</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getConnectedDevicesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Devices" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-lg font-bold">
                Total Connected: {Array.isArray(connectedDevices) ? connectedDevices.length : 0}
              </p>
              <p className="text-sm text-gray-500">
                Total Blocked: {blockedDevices?.total_blocked || 0}
              </p>
            </div>
          </div>

          {/* Bandwidth Usage Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Bandwidth Usage</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getBandwidthPieData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getBandwidthPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value).toFixed(2)} MB`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-lg font-bold">
                Total: {bandwidthUsage?.total_bandwidth_GB || '0'} GB
              </p>
            </div>
          </div>

          {/* Speed Test Card */}
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Connection Speed History</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getSpeedHistoryData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
                  <YAxis label={{ value: 'Speed (Kbps)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value} Kbps`} />
                  <Legend />
                  <Line type="monotone" dataKey="download" stroke="#8884d8" name="Download" />
                  <Line type="monotone" dataKey="upload" stroke="#82ca9d" name="Upload" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Current Download</p>
                <p className="text-lg font-bold">{speedTest?.downbandwidth || '0'} Kbps</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Current Upload</p>
                <p className="text-lg font-bold">{speedTest?.upbandwidth || '0'} Kbps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for status cards
const StatusCard = ({ title, value, color }) => {
  const getColorClass = () => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'red': return 'bg-red-100 text-red-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'purple': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded ${getColorClass()}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-lg font-bold truncate">{value}</p>
    </div>
  );
};

export default Dashboard;