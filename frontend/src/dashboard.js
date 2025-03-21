import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [driveData, setDriveData] = useState(null);
  const [error, setError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [filteredFiles, setFilteredFiles] = useState([]);

  const [isConnectedToGoogle, setIsConnectedToGoogle] = useState(false);

  useEffect(() => {
    const checkGoogleConnection = async () => {
      const token = localStorage.getItem("token");
      if (!token || !user) return;
      
      try {
        const response = await axios.get("http://localhost:5000/api/oauth/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsConnectedToGoogle(response.data.connected);
      } catch (err) {
        console.error("Failed to check Google connection status:", err);
        setIsConnectedToGoogle(false);
      }
    };
    
    if (user) {
      checkGoogleConnection();
    }
  }, [user]);

  // Fetch user info from backend (/api/auth/me) after mounting.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }
    axios
      .get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch user info:", err);
        setError("Failed to load user information.");
      });
  }, []);

  // Update filtered files whenever driveData, searchTerm, or fileTypeFilter changes
  useEffect(() => {
    if (driveData && driveData.status === "success" && driveData.data) {
      let filtered = driveData.data.files;
      
      // Filter by search term (file name)
      if (searchTerm) {
        filtered = filtered.filter(file => 
          file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by file type
      if (fileTypeFilter !== "all") {
        filtered = filtered.filter(file => {
          if (fileTypeFilter === "document") {
            return file.type.includes("document") || 
                   file.type.includes("spreadsheet") || 
                   file.type.includes("presentation");
          } else if (fileTypeFilter === "image") {
            return file.type.includes("image");
          } else if (fileTypeFilter === "video") {
            return file.type.includes("video");
          } else if (fileTypeFilter === "audio") {
            return file.type.includes("audio");
          } else if (fileTypeFilter === "pdf") {
            return file.type.includes("pdf");
          }
          return true;
        });
      }
      
      setFilteredFiles(filtered);
    }
  }, [driveData, searchTerm, fileTypeFilter]);

const fetchDriveData = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found");
    return;
  }
  setIsFetching(true);
  axios
    .get("http://localhost:5000/api/oauth/files", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      setDriveData(response.data);
      setIsConnectedToGoogle(true); // Update connection status on successful fetch
      setError("");
    })
    .catch((err) => {
      console.error("Error fetching Google Drive files:", err);
      setError("Error fetching Google Drive files.");
    })
    .finally(() => {
      setIsFetching(false);
    });
};

  // Initiate Google OAuth
  const handleConnectGoogle = () => {
    if (!user || !user.id) {
      console.error("User info not available");
      return;
    }
    const state = encodeURIComponent(JSON.stringify({ userId: user.id }));
    window.location.href = `http://localhost:5000/api/oauth/google?state=${state}`;
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFileTypeFilter("all");
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>
      {/* User Info Card */}
      {user ? (
        <div className="dashboard-userinfo">
          {/* Connection Status Indicator */}
          <div className="connection-status">
            <div className={`status-indicator ${isConnectedToGoogle ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {isConnectedToGoogle 
                  ? "Connected to Google Drive" 
                  : "Not connected to Google Drive"}
              </span>
            </div>
          </div>
          <div className="dashboard-buttons">
            <button onClick={handleConnectGoogle}>Connect to Google Drive</button>
            <button onClick={fetchDriveData}>Fetch Google Drive Files</button>
          </div>
        </div>
      ) : (
        <p>Loading user information...</p>
      )}

      {/* Error Message */}
      {error && <p className="dashboard-error">{error}</p>}

      {/* Loading Indicator */}
      {isFetching && <p className="dashboard-info">Fetching files, please wait...</p>}

      {/* Drive Files Section with Filtering */}
      {driveData && driveData.status === "success" && driveData.data && (
        <div className="dashboard-table-container">
          <h2>Google Drive Files</h2>
          
          {/* Filter Controls */}
          <div className="dashboard-filters">
            <div className="filter-group">
              <label htmlFor="search">Search by name:</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter file name..."
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="fileType">Filter by type:</label>
              <select
                id="fileType"
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
              >
                <option value="all">All Files</option>
                <option value="document">Documents</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDFs</option>
              </select>
            </div>
            
            <button onClick={resetFilters} className="reset-button">
              Reset Filters
            </button>
          </div>
          
          {/* Files Count */}
          <p className="file-count">
            Showing {filteredFiles.length} of {driveData.data.files.length} files
          </p>
          
          {filteredFiles.length > 0 ? (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>MIME Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td>{file.name}</td>
                    <td>{file.type}</td>
                    <td>
                      <a
                        href={`https://drive.google.com/file/d/${file.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "white", textDecoration: "underline" }}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="dashboard-info">No files found matching your filters.</p>
          )}
        </div>
      )}

      {/* If the response is an error from the backend */}
      {driveData && driveData.status === "error" && (
        <p className="dashboard-error">{driveData.message}</p>
      )}
    </div>
  );
}