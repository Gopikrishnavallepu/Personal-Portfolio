"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { HomeDashboard } from '@/components/HomeDashboard';
import { ResumeView } from '@/components/ResumeView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UploadModal } from '@/components/UploadModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { SettingsModal } from '@/components/SettingsModal';
import { Upload as UploadIcon, Download, FileText, Loader2, Menu, Settings, Plus, LogIn } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'blog' | 'resume'>('blog');
  const [flatList, setFlatList] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [downloadingMD, setDownloadingMD] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const { data: session } = useSession();
  const isAdmin = !!session;

  let prevFile: string | null = null;
  let nextFile: string | null = null;
  if (selectedFile) {
    const currentIndex = flatList.indexOf(selectedFile);
    if (currentIndex > 0) prevFile = flatList[currentIndex - 1];
    if (currentIndex !== -1 && currentIndex < flatList.length - 1) nextFile = flatList[currentIndex + 1];
  }

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExportPDF = async () => {
    if (!selectedFile || !selectedFile.endsWith('.md')) return;
    setExportingPDF(true);
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile })
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.split('/').pop()?.replace('.md', '.pdf') || 'export.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleDownloadMD = async () => {
    if (!selectedFile || !selectedFile.endsWith('.md')) return;
    setDownloadingMD(true);
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(selectedFile)}`);
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      
      const blob = new Blob([data.content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.split('/').pop() || 'file.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download MD file');
    } finally {
      setDownloadingMD(false);
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden w-full bg-white dark:bg-zinc-950">
      {/* Sidebar */}
      <div className={`${isLeftSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden backdrop-blur-sm z-20`}>
        <div className="w-64 h-full">
          <Sidebar onSelectFile={(file) => { setCurrentTab('blog'); setSelectedFile(file); }} refreshKey={refreshKey} onLoaded={setFlatList} onRefresh={handleUploadSuccess} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 transition-colors">
        {/* Site Header */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6 sm:px-12 py-6 flex-shrink-0 z-10">
          <div className="max-w-5xl mx-auto">
            {/* Header Top Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                  className="p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  title="Toggle Directory Sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 
                  className="text-2xl font-bold text-[#0a66c2] dark:text-blue-400 cursor-pointer"
                  onClick={() => {
                    setCurrentTab('blog');
                    setSelectedFile(null);
                  }}
                >
                  DevSecOps Blog
                </h1>
              </div>

              {/* Action Buttons & Theme */}
              <div className="flex items-center gap-2 sm:gap-3">
                {selectedFile && selectedFile.endsWith('.md') && (
                  <>
                    <button
                      onClick={handleDownloadMD}
                      disabled={downloadingMD}
                      title="Download MD File"
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors disabled:opacity-50 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    >
                      {downloadingMD ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
                      <span className="hidden sm:inline">MD</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={exportingPDF}
                      title="Export to PDF"
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-md transition-colors disabled:opacity-50 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    >
                      {exportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  </>
                )}

                {isAdmin ? (
                  <>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-md transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New Post</span>
                    </button>
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors cursor-pointer"
                    >
                      <UploadIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Upload</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => signIn('github')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-md transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 pl-8">
              Portfolio, learning journal and project tracker
            </p>

            {/* Navigation links row */}
            <nav className="flex gap-5 mt-4 pl-8 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-3">
              <button
                onClick={() => {
                  setCurrentTab('blog');
                  setSelectedFile(null);
                }}
                className={`text-sm font-semibold transition-colors cursor-pointer ${
                  currentTab === 'blog' && !selectedFile
                    ? 'text-[#0a66c2] dark:text-blue-400 underline decoration-2 underline-offset-4'
                    : 'text-zinc-500 hover:text-[#0a66c2] dark:hover:text-blue-400'
                }`}
              >
                Blog
              </button>
              <button
                onClick={() => {
                  setCurrentTab('resume');
                  setSelectedFile(null);
                }}
                className={`text-sm font-semibold transition-colors cursor-pointer ${
                  currentTab === 'resume'
                    ? 'text-[#0a66c2] dark:text-blue-400 underline decoration-2 underline-offset-4'
                    : 'text-zinc-500 hover:text-[#0a66c2] dark:hover:text-blue-400'
                }`}
              >
                Resume
              </button>
            </nav>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col h-full w-full bg-white dark:bg-zinc-950">
          {currentTab === 'resume' ? (
            <ResumeView />
          ) : selectedFile ? (
            <div className="flex-1 overflow-hidden h-full w-full flex flex-col">
              <MarkdownViewer 
                filePath={selectedFile} 
                onNavigate={(file) => { setCurrentTab('blog'); setSelectedFile(file); }} 
                onUpdateSuccess={() => setRefreshKey(prev => prev + 1)}
                prevFile={prevFile}
                nextFile={nextFile}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto w-full h-full">
              <HomeDashboard onSelectFile={(file) => { setCurrentTab('blog'); setSelectedFile(file); }} refreshKey={refreshKey} />
            </div>
          )}
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={handleUploadSuccess} 
      />
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newPath) => {
          handleUploadSuccess();
          setSelectedFile(newPath);
        }}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
