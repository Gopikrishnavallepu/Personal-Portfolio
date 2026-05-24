"use client";

import React, { useState, useEffect } from 'react';
import { X, FilePlus, Loader2, FolderPlus } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (path: string) => void;
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
  const [fileName, setFileName] = useState('');
  const [folder, setFolder] = useState('');
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<'post' | 'folder'>('post');
  const [folderName, setFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/files')
        .then(res => res.json())
        .then(data => {
          if (data.tree) {
            const dirs = data.tree
              .filter((n: any) => n.isDirectory)
              .map((n: any) => n.name);
            setFolders(dirs);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: fileName.trim(), folder }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');

      onSuccess(data.path);
      onClose();
      setFileName('');
      setFolder('');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setCreatingFolder(true);
    try {
      const res = await fetch('/api/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: folderName.trim(), parentFolder: folder }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create folder');

      alert('Folder created successfully!');
      setFolderName('');
      // Refresh folder list
      const filesRes = await fetch('/api/files');
      const filesData = await filesRes.json();
      if (filesData.tree) {
        const dirs = filesData.tree
          .filter((n: any) => n.isDirectory)
          .map((n: any) => n.name);
        setFolders(dirs);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create folder: ${err.message}`);
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 relative border border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setMode('post')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              mode === 'post'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            New Post
          </button>
          <button
            onClick={() => setMode('folder')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              mode === 'folder'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
        </div>

        {mode === 'post' ? (
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Post Title
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                placeholder="e.g., Kubernetes_Security_Best_Practices"
                autoFocus
              />
              <p className="text-xs text-zinc-500 mt-1.5">.md extension will be added automatically</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Category Folder
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm cursor-pointer"
              >
                <option value="">Root (blog-posts/)</option>
                {folders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!fileName.trim() || creating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                Create Post
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Folder Name
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., SIEM_Guides"
                autoFocus
              />
              <p className="text-xs text-zinc-500 mt-1.5">Spaces will be converted to underscores</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Parent Folder (optional)
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
              >
                <option value="">Root (blog-posts/)</option>
                {folders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!folderName.trim() || creatingFolder}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                Create Folder
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
