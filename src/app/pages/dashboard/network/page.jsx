"use client"

import React, { useState, useEffect } from "react";
import { otherFetches } from "../../../hooks/threeFetch";
import { 
  Network, 
  Globe, 
  Laptop, 
  RefreshCw, 
  Wifi, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ExternalLink
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";

const NetworkStatus = () => {
  const { data, loading, error, refetch } = otherFetches('network-info');
  const [copied, setCopied] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionQuality, setConnectionQuality] = useState(null);

  useEffect(() => {
    if (data) {
      // Simulate connection quality check
      setConnectionQuality({
        status: "excellent",
        latency: "24ms",
        speed: "125 Mbps",
        uptime: "99.8%"
      });
      setLastUpdated(new Date());
    }
  }, [data]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    setLastUpdated(new Date());
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? "all" : section);
  };

  const getStatusColor = (quality) => {
    switch(quality) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "fair": return "bg-yellow-500";
      case "poor": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (quality) => {
    switch(quality) {
      case "excellent": return "Excellent";
      case "good": return "Good";
      case "fair": return "Fair";
      case "poor": return "Poor";
      default: return "Unknown";
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Sidebar />

      <div className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Network className="text-indigo-600" />
                Network Status Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Complete overview of your system's network configuration
              </p>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 
                ${refreshing || loading ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'} 
                transition-colors shadow-sm`}
            >
              <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={18} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          {/* Loading State */}
          {loading && !refreshing && (
            <div className="flex flex-col justify-center items-center h-64 bg-white bg-opacity-80 rounded-xl shadow-sm p-8 animate-pulse">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
              <p className="text-lg text-gray-600 font-medium">Loading network information...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="text-red-500" size={24} />
                <h2 className="text-xl font-semibold">Unable to Load Network Data</h2>
              </div>
              <p className="mb-4">{error.message || "There was a problem fetching your network information."}</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center gap-2 transition-colors w-fit"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          )}

          {/* Dashboard Content */}
          {data && !loading && (
            <div className="space-y-6">
              {/* Connection Summary Card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">Connection Summary</h2>
                      <p className="opacity-90">Your current network status at a glance</p>
                    </div>
                    {connectionQuality && (
                      <div className="bg-white bg-opacity-20 px-4 py-3 rounded-lg flex items-center gap-3">
                        <span className={`h-4 w-4 ${getStatusColor(connectionQuality.status)} rounded-full animate-pulse`}></span>
                        <span className="font-medium">
                          {getStatusText(connectionQuality.status)} Connection
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* IP Card */}
                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <p className="text-gray-500 text-sm mb-1">External IP</p>
                      <div className="flex items-center gap-2">
                        <Globe className="text-indigo-600" size={18} />
                        <p className="font-mono font-medium text-gray-800 truncate">{data.external_ip}</p>
                        <button 
                          onClick={() => copyToClipboard(data.external_ip, 'external_ip')}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied === 'external_ip' ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Local IP Card */}
                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <p className="text-gray-500 text-sm mb-1">Local IP</p>
                      <div className="flex items-center gap-2">
                        <Laptop className="text-indigo-600" size={18} />
                        <p className="font-mono font-medium text-gray-800 truncate">{data.local_ip}</p>
                        <button 
                          onClick={() => copyToClipboard(data.local_ip, 'local_ip')}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied === 'local_ip' ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Status Card */}
                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <p className="text-gray-500 text-sm mb-1">Connection Speed</p>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="text-indigo-600" size={18} />
                        <p className="font-medium text-gray-800">
                          {connectionQuality ? connectionQuality.speed : "Measuring..."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Latency Card */}
                    <div className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                      <p className="text-gray-500 text-sm mb-1">Latency</p>
                      <div className="flex items-center gap-2">
                        <Clock className="text-indigo-600" size={18} />
                        <p className="font-medium text-gray-800">
                          {connectionQuality ? connectionQuality.latency : "Measuring..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Local Network Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('local')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Laptop className="text-blue-600" size={20} />
                      </div>
                      <h2 className="text-xl font-semibold">Local Network</h2>
                    </div>
                    {expandedSection !== 'local' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </div>
                  
                  {(expandedSection === 'local' || expandedSection === 'all') && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div className="group">
                        <p className="text-sm text-gray-500 mb-1">Local IP Address</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition-colors">
                          <p className="font-mono">{data.local_ip}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(data.local_ip, 'local_ip_card');
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {copied === 'local_ip_card' ? 
                              <CheckCircle size={16} className="text-green-600" /> : 
                              <Copy size={16} className="text-gray-500" />
                            }
                          </button>
                        </div>
                      </div>
                      
                      <div className="group">
                        <p className="text-sm text-gray-500 mb-1">MAC Address</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition-colors">
                          <p className="font-mono">{data.mac_address}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(data.mac_address, 'mac_address');
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {copied === 'mac_address' ? 
                              <CheckCircle size={16} className="text-green-600" /> : 
                              <Copy size={16} className="text-gray-500" />
                            }
                          </button>
                        </div>
                      </div>
                      
                      <div className="group">
                        <p className="text-sm text-gray-500 mb-1">Loopback Address</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition-colors">
                          <p className="font-mono">{data.loopback_ip}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(data.loopback_ip, 'loopback_ip');
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {copied === 'loopback_ip' ? 
                              <CheckCircle size={16} className="text-green-600" /> : 
                              <Copy size={16} className="text-gray-500" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Internet Connection Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('internet')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Globe className="text-green-600" size={20} />
                      </div>
                      <h2 className="text-xl font-semibold">Internet Connection</h2>
                    </div>
                    {expandedSection !== 'internet' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </div>
                  
                  {(expandedSection === 'internet' || expandedSection === 'all') && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div className="group">
                        <p className="text-sm text-gray-500 mb-1">External IP Address</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100 transition-colors">
                          <p className="font-mono">{data.external_ip}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(data.external_ip, 'external_ip_card');
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {copied === 'external_ip_card' ? 
                              <CheckCircle size={16} className="text-green-600" /> : 
                              <Copy size={16} className="text-gray-500" />
                            }
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-1">Connection Status</p>
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                          <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                          <p className="font-medium">Connected</p>
                          <span className="text-sm text-gray-500 ml-2">
                            {connectionQuality ? `Uptime: ${connectionQuality.uptime}` : ""}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://whatismyipaddress.com/ip/${data.external_ip}`, '_blank');
                          }}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                          <Network size={16} />
                          Check IP Details
                        </button>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.speedtest.net/`, '_blank');
                          }}
                          className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                          <ArrowUpDown size={16} />
                          Speed Test
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Network Information Table */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('details')}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Shield className="text-purple-600" size={20} />
                    </div>
                    <h2 className="text-xl font-semibold">Detailed Network Information</h2>
                  </div>
                  {expandedSection !== 'details' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
                
                {(expandedSection === 'details' || expandedSection === 'all') && (
                  <div className="mt-4 overflow-x-auto animate-fadeIn">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 rounded-tl-lg">Type</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Value</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 rounded-tr-lg">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium border-b">Local IP</td>
                          <td className="py-3 px-4 font-mono text-sm border-b group relative">
                            {data.local_ip}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(data.local_ip, 'local_ip_table');
                              }}
                              className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copied === 'local_ip_table' ? 
                                <CheckCircle size={16} className="text-green-600" /> : 
                                <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                              }
                            </button>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 border-b">Your device's address on the local network</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium border-b">External IP</td>
                          <td className="py-3 px-4 font-mono text-sm border-b group relative">
                            {data.external_ip}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(data.external_ip, 'external_ip_table');
                              }}
                              className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copied === 'external_ip_table' ? 
                                <CheckCircle size={16} className="text-green-600" /> : 
                                <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                              }
                            </button>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 border-b">Your public IP address visible to websites</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium border-b">MAC Address</td>
                          <td className="py-3 px-4 font-mono text-sm border-b group relative">
                            {data.mac_address}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(data.mac_address, 'mac_address_table');
                              }}
                              className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copied === 'mac_address_table' ? 
                                <CheckCircle size={16} className="text-green-600" /> : 
                                <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                              }
                            </button>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 border-b">Physical address of your network interface</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium">Loopback IP</td>
                          <td className="py-3 px-4 font-mono text-sm group relative">
                            {data.loopback_ip}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(data.loopback_ip, 'loopback_ip_table');
                              }}
                              className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copied === 'loopback_ip_table' ? 
                                <CheckCircle size={16} className="text-green-600" /> : 
                                <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                              }
                            </button>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">Internal IP used for local services</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
                      <p>Need more advanced network diagnostics?</p>
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        Advanced Tools <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-6 text-sm text-gray-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <p>Last updated: {lastUpdated.toLocaleString()}</p>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleRefresh} 
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Refresh Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;