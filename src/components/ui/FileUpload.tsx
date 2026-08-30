// ============================================================
// FILE UPLOAD COMPONENT — React + TypeScript
// Eldermin ERP | Reusable across all modules
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { safeParseLocalStorage } from '../../lib/safeParseLocalStorage';

// Every real API client in this app authenticates via 'eldermin_token' /
// 'eldermin_institution' (see services/*.api.ts's request interceptors) -
// plain 'token'/'schoolSlug' keys are never actually set anywhere by the
// real login flow (auth.service.ts), so a request built from them always
// sent an empty Bearer token and was rejected by the global JwtAuthGuard.
// This silently broke every upload through this component (staff/student
// photos, documents, etc.) - not just newly-added callers.
function getAuthHeaders(schoolSlugOverride?: string) {
  const token = localStorage.getItem('eldermin_token') || '';
  const schoolSlug = schoolSlugOverride
    || safeParseLocalStorage<{ slug?: string }>('eldermin_institution')?.slug
    || 'demo-school';
  return { Authorization: `Bearer ${token}`, 'x-school-slug': schoolSlug };
}

interface UploadedFile {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface FileUploadProps {
  folder: string;                           // e.g. 'documents', 'students', 'staff'
  accept?: string;                          // e.g. '.pdf,.docx,.jpg'
  multiple?: boolean;
  maxFiles?: number;
  onUpload: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  label?: string;
  sublabel?: string;
  existingFiles?: UploadedFile[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
  if (type === 'application/pdf') return <FileText size={16} className="text-red-500" />;
  return <File size={16} className="text-gray-500" />;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  folder, accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  multiple = false, maxFiles = 5,
  onUpload, onError, label, sublabel, existingFiles = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;

    setUploading(true);
    setProgress(0);

    try {
      const results: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const response = await fetch(`${API_BASE}/api/v1/upload/single/${folder}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Upload failed');
        }

        const data = await response.json();
        results.push(data.data);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const newFiles = [...uploadedFiles, ...results];
      setUploadedFiles(newFiles);
      onUpload(newFiles);
    } catch (err: any) {
      onError?.(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [folder, uploadedFiles, onUpload, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files.slice(0, maxFiles));
  }, [uploadFiles, maxFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    uploadFiles(files.slice(0, maxFiles));
    e.target.value = '';
  };

  const removeFile = async (index: number) => {
    const file = uploadedFiles[index];
    try {
      await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: file.key }),
      });
    } catch { /* silently fail */ }
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onUpload(newFiles);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragging ? 'border-[#1e3a5f] bg-blue-50' : 'border-gray-200 hover:border-[#1e3a5f] hover:bg-gray-50'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader size={24} className="text-[#1e3a5f] animate-spin" />
            <p className="text-xs text-gray-600">Uploading... {progress}%</p>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5">
              <div className="bg-[#1e3a5f] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-400" />
            <p className="text-sm font-medium text-gray-600">{label || 'Click or drag files here'}</p>
            <p className="text-[10px] text-gray-400">{sublabel || `Supports: PDF, Word, Images (Max 10MB)`}</p>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              {getFileIcon(file.fileType)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{file.fileName}</p>
                <p className="text-[10px] text-gray-400">{formatSize(file.fileSize)}</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-[#1e3a5f] hover:underline">View</a>
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Avatar/Profile Photo Upload ───────────────────────────────
export const PhotoUpload: React.FC<{
  currentUrl?: string;
  onUpload: (url: string, key: string) => void;
  folder?: string;
}> = ({ currentUrl, onUpload, folder = 'photos' }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/api/v1/upload/single/${folder}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      onUpload(data.data.url, data.data.key);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 cursor-pointer" onClick={() => inputRef.current?.click()}>
        {preview ? (
          <img src={preview} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" alt="Profile" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            <Upload size={20} className="text-gray-400" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader size={16} className="text-white animate-spin" />
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#1e3a5f] rounded-full flex items-center justify-center">
          <Upload size={10} className="text-white" />
        </div>
      </div>
      <p className="text-[10px] text-gray-400">Click to upload photo</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
};
