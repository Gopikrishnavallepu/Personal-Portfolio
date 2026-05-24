"use client";

import React, { useState } from 'react';
import { X, Upload, Loader2, LogIn } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState('Cloud_Security_Guides');
  const { data: session } = useSession();

  if (!isOpen) return null;

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 relative border border-zinc-200 dark:border-zinc-800">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center text-center py-8">
            <span className="text-4xl mb-4">🔒</span>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Authentication Required</h3>
            <p className="text-sm text-zinc-500 mb-6">Sign in with GitHub to upload files.</p>
            <button
              onClick={() => signIn('github')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#24292F] hover:bg-[#24292F]/90 rounded-md transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('date', new Date().toISOString());
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      onSuccess();
      onClose();
      setFile(null);
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 relative border border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-50">Upload Blog Post</h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-4 text-zinc-400" />
            <input
              type="file"
              accept=".md,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Browse files
            </label>
            <p className="text-xs text-zinc-500 mt-2">Only Markdown (.md) files are supported</p>
            {file && <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-4 font-medium">{file.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Select Folder</label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Cloud_Security_Guides"
            />
            <p className="text-xs text-zinc-500 mt-1">Specify the folder in the repository to upload this file to.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
