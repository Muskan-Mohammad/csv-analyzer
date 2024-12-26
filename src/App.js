import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:5000');

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [insights, setInsights] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    socket.on('processingComplete', (data) => {
      setUploadStatus(data.message);
    });

    return () => {
      socket.off('processingComplete');
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      setUploadStatus('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('Uploading...');
      setUploadProgress(0);

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setInsights(data);
      setUploadStatus('Upload complete');
      setUploadProgress(100);
    } catch (error) {
      setUploadStatus('Upload failed: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="App p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">CSV Analyzer</h1>
      <div className="mb-4">
        <input type="file" onChange={handleFileChange} accept=".csv" className="mr-2" />
        <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">Upload</button>
      </div>
      <p className="mb-2">Status: {uploadStatus}</p>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <progress value={uploadProgress} max="100" className="w-full" />
      )}
      {insights && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Insights</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-bold mb-2">Total Rows</h3>
              <p>{insights.totalRows}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-bold mb-2">Most Common Category</h3>
              <p>{insights.mostCommonCategory}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-bold mb-2">Total Amount</h3>
              <p>{formatCurrency(insights.totalAmount)}</p>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-4">Amount by Category</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={Object.entries(insights.categoryTotals).map(([category, amount]) => ({
                category,
                amount
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;

