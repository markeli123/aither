// App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './login';         // Adjust the path if needed
import Dashboard from './dashboard'; // Adjust the path if needed

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />           {/* Default route */}
        <Route path="/login" element={<Login />} />        {/* Explicit login route */}
        <Route path="/dashboard" element={<Dashboard />} />{/* Dashboard route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
