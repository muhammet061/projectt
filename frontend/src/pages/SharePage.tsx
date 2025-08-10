import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Lock, AlertCircle, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface FileInfo {
  original_name: string;
  file_size: number;
  mime_type: string;
  has_password: boolean;
  download_count: number;
  expires_at: string;
  created_at: string;
}

const SharePage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const checkFileInfo = async () => {
    if (!uuid) return;

    setLoading(true);
    setError(null);
    console.log('🔍 Checking file info for UUID:', uuid);

    try {
      // DOĞRU API ENDPOINT!
      const response = await api.get(`/api/files/info/${uuid}`);
      const file = response.data.file;
      console.log('✅ File info received:', file);
      
      setFileInfo(file);
      
      if (file.has_password) {
        console.log('🔒 File has password, showing password form');
        setPasswordRequired(true);
      } else {
        console.log('🔓 File has no password, will auto-download');
        setPasswordRequired(false);
        // Auto-download after 1 second for non-password protected files
        setTimeout(() => {
          console.log('⏰ Starting auto-download...');
          downloadFile();
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Error checking file info:', error);
      if (error.response?.status === 404) {
        setError('File not found');
      } else if (error.response?.status === 410) {
        setError('File has expired and is no longer available');
      } else {
        setError('Failed to load file information');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    if (!uuid) return;

    setDownloading(true);
    setError(null);
    console.log('⬇️ Starting download for UUID:', uuid);

    try {
      // BACKEND DOWNLOAD URL - DOĞRU!
      const downloadUrl = `http://localhost:8080/share/${uuid}${password ? `?password=${encodeURIComponent(password)}` : ''}`;
      console.log('📥 Download URL:', downloadUrl);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
      console.log('✅ Download successful');
      
      // Update file info to reflect new download count
      setTimeout(() => checkFileInfo(), 1000);
    } catch (error: any) {
      console.error('❌ Download error:', error);
      setError('Download failed. Please check the password and try again.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 SharePage mounted, checking file info...');
    checkFileInfo();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <FileText className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          File Download
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* DEBUG INFO */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>DEBUG:</strong><br/>
            UUID: {uuid}<br/>
            Password Required: {passwordRequired ? 'YES' : 'NO'}<br/>
            Has Password: {fileInfo?.has_password ? 'YES' : 'NO'}<br/>
            Error: {error || 'None'}<br/>
            File Info: {fileInfo ? 'Loaded' : 'Not loaded'}<br/>
            Loading: {loading ? 'YES' : 'NO'}<br/>
            API Base URL: http://localhost:8080<br/>
            Download URL: http://localhost:8080/share/{uuid}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {fileInfo && (
            <div className="mb-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {fileInfo.original_name}
              </h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(fileInfo.file_size)} • Downloaded {fileInfo.download_count} times
              </p>
            </div>
          )}

          {passwordRequired && fileInfo ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Lock className="mx-auto h-16 w-16 text-orange-500 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Password Protected File
                </p>
                <p className="text-sm text-gray-600">
                  This file requires a password to download
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Enter Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter file password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        downloadFile();
                      }
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This file is password protected. Enter the correct password to download.
                </p>
              </div>

              <button
                onClick={() => downloadFile()}
                disabled={downloading || !password.trim()}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download File'}
              </button>
            </div>
          ) : fileInfo && !error ? (
            <div className="text-center">
              <Download className="mx-auto h-16 w-16 text-primary-600 mb-4" />
              <p className="text-sm font-medium text-green-600 mb-2">
                {downloading ? 'Download Starting...' : 'Download will start automatically...'}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Your download should start automatically. If not, click the button below.
              </p>
              
              <button
                onClick={() => downloadFile()}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Now
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SharePage;