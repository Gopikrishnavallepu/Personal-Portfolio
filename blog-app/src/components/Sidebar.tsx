"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Search, MoreVertical, Edit3, Trash2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface SidebarProps {
  onSelectFile: (path: string) => void;
  refreshKey: number;
  onLoaded?: (flatList: string[]) => void;
  onRefresh?: () => void;
}

const ContextMenu = ({ 
  x, y, onRename, onDelete, onClose 
}: { 
  x: number; y: number; onRename: () => void; onDelete: () => void; onClose: () => void 
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onRename}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
      >
        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
        Rename
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
  );
};

const TreeNode = ({ 
  node, onSelectFile, isAdmin, onRefresh 
}: { 
  node: FileNode; onSelectFile: (path: string) => void; isAdmin: boolean; onRefresh?: () => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdmin || node.isDirectory) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: rect.right, y: rect.bottom });
  };

  const handleRename = async () => {
    if (!renameValue.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: node.path, newName: renameValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rename failed');
      setIsRenaming(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Rename failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setContextMenu(null);
    if (!window.confirm(`Delete "${node.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: node.path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (node.isDirectory) {
    return (
      <div className="ml-2">
        <div 
          className="flex items-center cursor-pointer py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="w-4 h-4 mr-1 text-zinc-500" /> : <ChevronRight className="w-4 h-4 mr-1 text-zinc-500" />}
          <Folder className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-sm truncate select-none text-zinc-700 dark:text-zinc-300 font-medium">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div className="ml-2 border-l border-zinc-200 dark:border-zinc-700 pl-2">
            {node.children.map((child, idx) => (
              <TreeNode key={idx} node={child} onSelectFile={onSelectFile} isAdmin={isAdmin} onRefresh={onRefresh} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 ml-4 py-1 px-1">
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setIsRenaming(false);
          }}
          className="flex-1 text-xs px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-blue-400 dark:border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 min-w-0"
          autoFocus
          disabled={saving}
        />
        <button
          onClick={() => setIsRenaming(false)}
          className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div 
        className="flex items-center cursor-pointer py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 ml-4 transition-colors group"
        onClick={() => onSelectFile(node.path)}
        onContextMenu={handleContextMenu}
      >
        <FileText className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors flex-shrink-0" />
        <span className="text-sm truncate select-none text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
          {node.name.replace('.md', '').replace('.pdf', '')}
        </span>
        {isAdmin && (
          <button
            onClick={handleMoreClick}
            className="ml-auto p-0.5 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all cursor-pointer flex-shrink-0"
            title="Actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={() => {
            setContextMenu(null);
            setRenameValue(node.name);
            setIsRenaming(true);
          }}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};

export function Sidebar({ onSelectFile, refreshKey, onLoaded, onRefresh }: SidebarProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();
  const isAdmin = !!session;

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (data.tree) setTree(data.tree);
        if (data.flatList && onLoaded) onLoaded(data.flatList);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load file tree', err);
        setLoading(false);
      });
  }, [refreshKey]);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;
    const lowerQuery = searchQuery.toLowerCase();
    
    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.isDirectory && node.children) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerQuery)) {
            return { ...node, children: filteredChildren };
          }
          return null;
        } else {
          if (node.name.toLowerCase().includes(lowerQuery)) return node;
          return null;
        }
      }).filter(Boolean) as FileNode[];
    };
    
    return filterNodes(tree);
  }, [tree, searchQuery]);

  return (
    <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col h-full overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">Directory</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {loading ? (
          <div className="flex items-center justify-center h-20 text-zinc-500">Loading...</div>
        ) : filteredTree.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-zinc-400">No matching files</div>
        ) : (
          filteredTree.map((node, idx) => (
            <TreeNode key={idx} node={node} onSelectFile={onSelectFile} isAdmin={isAdmin} onRefresh={onRefresh} />
          ))
        )}
      </div>
    </div>
  );
}
