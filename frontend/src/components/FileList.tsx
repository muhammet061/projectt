import React, { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Download, Clock, Lock } from 'lucide-react';
import { filesAPI } from '../services/api';
import toast from 'react-hot-toast';

interface FileItem {
  id: number;
  uuid: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  has_password: boolean;
  download_count: number;
  expires_at: string;
  created_at: string;
  is_expired: boolean;
}

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const response = await filesAPI.getUserFiles();
      setFiles(response.data.files || []);
    } catch (error: any) {
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = async (uuid: string) => {
    try {
      const url = `http://localhost:3000/share/${uuid}`;
      await navigator.clipboard.writeText(url);
      setCopiedUrl(uuid);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const deleteFile = async (uuid: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await filesAPI.deleteFile(uuid);
      toast.success('File deleted successfully');
      fetchFiles(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete file');
    }
  };

  const getStatusColor = (file: FileItem) => {
    if (file.is_expired) return 'text-red-600 bg-red-50';
    const hoursLeft = (new Date(file.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 2) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold text-gray-900">My Files</h2>
        <p className="text-gray-600 mt-1">Manage your uploaded files</p>
      </div>

      {files.length === 0 ? (
        <div className="p-12 text-center">
          <Download className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 mb-2">No files uploaded yet</p>
          <p className="text-gray-500">Upload your first file to get started</p>
        </div>
      ) : (
        <div className="divide-y">
          {files.map((file) => (
            <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{file.original_name}</h3>
                    {file.has_password && (
                      <Lock className="h-4 w-4 text-orange-500" title="Password protected" />
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file)}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {getTimeLeft(file.expires_at)}
                    </span>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(file.file_size)}
                    </div>
                    <div>
                      <span className="font-medium">Downloads:</span> {file.download_count}
                    </div>
                    <div>
                      <span className="font-medium">Uploaded:</span> {new Date(file.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span> {new Date(file.expires_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <code className="text-xs bg-green-100 px-2 py-1 rounded flex-1 truncate font-bold">
                      http://localhost:3000/share/{file.uuid}
                    </code>
                    <button
                      onClick={() => copyToClipboard(file.uuid)}
                      disabled={file.is_expired}
                      className="p-2 text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Copy link"
                    >
                      {copiedUrl === file.uuid ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteFile(file.uuid, file.original_name)}
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;