import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const FileUpload = ({ userId }) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!file.name.endsWith('.fit')) {
      setError('Only .fit files are supported');
      return;
    }

    setUploading(true);
    setProgress(0);
    setSuccess(false);

    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `fit-files/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('workout-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });

      if (uploadError) {
        throw uploadError;
      }

      // Trigger file parsing
      await parseAndStoreFitFile(filePath, userId);
      
      setSuccess(true);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('fit-file-input');
      if (fileInput) {
        fileInput.value = '';
      }
      
      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'An error occurred during upload');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fit-file-upload p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Upload Workout File</h3>
      
      <input 
        id="fit-file-input"
        type="file" 
        accept=".fit"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      
      {file && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Selected file: <span className="font-medium">{file.name}</span></p>
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
      
      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">{progress}%</p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
          File uploaded and processed successfully!
        </div>
      )}
      
      <p className="mt-4 text-xs text-gray-500">
        Supported file format: .fit (from Garmin, Polar, Suunto devices)
      </p>
    </div>
  );
};

// This is a placeholder - the actual implementation will be in a separate service file
const parseAndStoreFitFile = async (filePath, userId) => {
  // This function will be implemented in fitParserService.js
  console.log(`Parsing file ${filePath} for user ${userId}`);
  return Promise.resolve();
};

export default FileUpload;
