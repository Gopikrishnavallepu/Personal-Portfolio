"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Search } from 'lucide-react';

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
}

const TreeNode = ({ node, onSelectFile }: { node: FileNode, onSelectFile: (path: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

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
              <TreeNode key={idx} node={child} onSelectFile={onSelectFile} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="flex items-center cursor-pointer py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 ml-4 transition-colors group"
      onClick={() => onSelectFile(node.path)}
    >
      <FileText className="w-4 h-4 mr-2 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
      <span className="text-sm truncate select-none text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
        {node.name.replace('.md', '').replace('.pdf', '')}
      </span>
    </div>
  );
};

export function Sidebar({ onSelectFile, refreshKey, onLoaded }: SidebarProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
            <TreeNode key={idx} node={node} onSelectFile={onSelectFile} />
          ))
        )}
      </div>
    </div>
  );
}
