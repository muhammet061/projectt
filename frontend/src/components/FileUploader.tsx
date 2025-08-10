import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Lock, Copy, Check } from 'lucide-react';
import { filesAPI } from '../services/api';
import toast from 'react-hot-toast';

interface UploadedFile {
  uuid: string;
  share_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
  has_password: boolean;
}

const FileUploader: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = async (url: string) => {
    try {
      const fullUrl = `http://localhost:3000${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    if (password.trim()) {
      formData.append('password', password.trim());
    }

    try {
      const response = await filesAPI.upload(formData);
      setUploadedFiles(response.data.files);
      setSelectedFiles([]);
      setPassword('');
      toast.success(`${response.data.files.length} file(s) uploaded successfully!`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Files</h2>
      
      {/* File dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-primary-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Files will be available for 24 hours
            </p>
          </div>
        )}
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password protection */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <label className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Password protect (optional)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to protect files"
            className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {/* Upload button */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </button>
        </div>
      )}

      {/* Upload results */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Share Links</h3>
          <div className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.file_name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.file_size)} • Expires: {new Date(file.expires_at).toLocaleString()}
                      {file.has_password && <span className="ml-2 text-orange-600">🔒 Password protected</span>}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <code className="text-xs bg-green-100 px-2 py-1 rounded flex-1 font-bold">
                        http://localhost:3000/share/{file.uuid}
                      </code>
                      <button
                        onClick={() => copyToClipboard(`/share/${file.uuid}`)}
                        className="p-2 text-primary-600 hover:text-primary-700"
                        title="Copy link"
                      >
                        {copiedUrl === `/share/${file.uuid}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;