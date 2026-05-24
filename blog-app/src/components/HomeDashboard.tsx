"use client";

import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSession } from 'next-auth/react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface HomeDashboardProps {
  onSelectFile: (path: string) => void;
  refreshKey: number;
}

const DashboardTreeNode = ({ node, onSelectFile }: { node: FileNode, onSelectFile: (path: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (node.isDirectory) {
    return (
      <div className="ml-6 mt-2">
        <div 
          className="flex items-center cursor-pointer py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md px-3 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="w-5 h-5 mr-2 text-zinc-500" /> : <ChevronRight className="w-5 h-5 mr-2 text-zinc-500" />}
          <Folder className="w-6 h-6 mr-3 text-blue-500" />
          <span className="text-base font-semibold text-zinc-800 dark:text-zinc-200">{node.name}</span>
          <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {node.children?.length || 0} items
          </span>
        </div>
        {isOpen && node.children && (
          <div className="ml-4 border-l-2 border-zinc-200 dark:border-zinc-700 pl-2 mt-1">
            {node.children.map((child, idx) => (
              <DashboardTreeNode key={idx} node={child} onSelectFile={onSelectFile} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="flex items-center cursor-pointer py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md px-3 ml-8 mt-1 transition-colors group"
      onClick={() => onSelectFile(node.path)}
    >
      <FileText className="w-5 h-5 mr-3 text-zinc-400 group-hover:text-blue-500 transition-colors" />
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
        {node.name.replace('.md', '').replace('.pdf', '')}
      </span>
      <span className="ml-auto text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Open →
      </span>
    </div>
  );
};

export function HomeDashboard({ onSelectFile, refreshKey }: HomeDashboardProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexContent, setIndexContent] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: session } = useSession();
  const isAdmin = !!session;

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (data.tree) setTree(data.tree);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load file tree', err);
        setLoading(false);
      });

    fetch(`/api/file?path=INDEX.md&t=${Date.now()}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('INDEX.md not found');
      })
      .then(data => {
        setIndexContent(data.content);
        setEditContent(data.content);
      })
      .catch(() => setIndexContent(null));
  }, [refreshKey]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'INDEX.md', content: editContent })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setIndexContent(editContent);
      setIsEditing(false);
      alert('INDEX.md saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const LinkRenderer = (props: any) => {
    const { href, children, ...rest } = props;
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      return (
        <a 
          href={href} 
          {...rest}
          onClick={(e) => {
            e.preventDefault();
            let newPath = href;
            if (newPath.startsWith('./')) {
               newPath = newPath.substring(2);
            }
            onSelectFile(newPath);
          }}
        >
          {children}
        </a>
      );
    }
    return <a href={href} {...rest}>{children}</a>;
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 sm:px-12 w-full">
      {indexContent !== null && (
        <div className="mb-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm relative">
          {isAdmin && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                >
                  Edit Index
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(indexContent || '');
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          )}
          
          <div className="p-8">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[300px] p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            ) : (
              <article className="prose prose-zinc dark:prose-invert max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{ a: LinkRenderer }}
                >
                  {indexContent}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      )}

      {indexContent === null && (
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-6">
            <Network className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Directory Context
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Explore the tree structure of your folders below to understand the files and data present in your workspace.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden">
        <h2 className="text-xl font-bold mb-4 text-zinc-800 dark:text-zinc-200 flex items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <Folder className="w-6 h-6 mr-3 text-zinc-400" />
          Workspace Root
        </h2>
        <div className="overflow-y-auto max-h-[60vh] pr-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-zinc-500 animate-pulse">Scanning directories...</div>
          ) : (
            tree.map((node, idx) => (
              <DashboardTreeNode key={idx} node={node} onSelectFile={onSelectFile} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
