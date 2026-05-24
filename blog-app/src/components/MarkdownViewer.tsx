"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import matter from 'gray-matter';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; 
import { Loader2, X, AlignLeft, Edit3, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface MarkdownViewerProps {
  filePath: string | null;
  onNavigate?: (path: string) => void;
  onUpdateSuccess?: () => void;
  prevFile?: string | null;
  nextFile?: string | null;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
    toc.push({ id, text, level });
  }
  return toc;
}

const flatten = (text: string, child: any): string => {
  return typeof child === 'string'
    ? text + child
    : React.Children.toArray(child.props.children).reduce(flatten, text);
};

export function MarkdownViewer({ filePath, onNavigate, onUpdateSuccess, prevFile, nextFile }: MarkdownViewerProps) {
  const [content, setContent] = useState('');
  const [rawFileContent, setRawFileContent] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(true);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: session } = useSession();
  const isAdmin = !!session;
  
  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!filePath) return;
    
    setLoading(true);
    setError(null);
    setIsEditing(false);
    setIsRenaming(false);
    
    if (filePath.endsWith('.pdf')) {
      setMetadata({ title: filePath.split('/').pop() });
      setContent('');
      setLoading(false);
      return;
    }

    fetch(`/api/file?path=${encodeURIComponent(filePath)}&t=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch file');
        return res.json();
      })
      .then(data => {
        setRawFileContent(data.content);
        const parsed = matter(data.content);
        setMetadata(parsed.data);
        setContent(parsed.content);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Error loading file.');
        setLoading(false);
      });
  }, [filePath]);

  const toc = useMemo(() => extractToc(content), [content]);

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditContent(rawFileContent);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!filePath) return;
    setSaving(true);
    
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content: editContent })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      // Success
      setRawFileContent(editContent);
      const parsed = matter(editContent);
      setMetadata(parsed.data);
      setContent(parsed.content);
      setIsEditing(false);
      alert('File saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async () => {
    if (!filePath || !renameValue.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: filePath, newName: renameValue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename');
      
      setIsRenaming(false);
      alert('File renamed successfully!');
      if (onNavigate) onNavigate(data.newPath);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      console.error(err);
      alert(`Rename failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!filePath) return;
    if (!window.confirm('Are you sure you want to permanently delete this file?')) return;
    
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      
      alert('File deleted successfully!');
      if (onNavigate) onNavigate('');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      console.error(err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (!filePath) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  const isPdf = filePath.endsWith('.pdf');

  if (isPdf) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {metadata.title}
          </h1>
        </div>
        <div className="flex-1 w-full bg-zinc-100 dark:bg-zinc-900">
          <iframe 
            src={`/api/file?path=${encodeURIComponent(filePath)}`} 
            className="w-full h-full border-none"
            title={metadata.title}
          />
        </div>
      </div>
    );
  }

  const HeadingRenderer = (props: any) => {
    const children = React.Children.toArray(props.children);
    const text = children.reduce(flatten, '');
    const slug = text.toLowerCase().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
    const level = props.level || (props.node && props.node.tagName ? props.node.tagName.replace('h', '') : '1');
    const { node, ...validProps } = props;
    return React.createElement(`h${level}`, { id: slug, ...validProps }, props.children);
  };

  const LinkRenderer = (props: any) => {
    const { href, children, ...rest } = props;
    
    // Check if it's an internal local link
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      return (
        <a 
          href={href} 
          {...rest}
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) {
              // Try to normalize the path relative to the current file
              // For simplicity, we assume links are relative to workspace root or we just clean up ./
              let newPath = href;
              if (newPath.startsWith('./')) {
                 newPath = newPath.substring(2);
              }
              onNavigate(newPath);
            }
          }}
        >
          {children}
        </a>
      );
    }
    
    return <a href={href} {...rest}>{children}</a>;
  };

  return (
    <div className="flex h-full relative w-full">
      <div className="flex-1 overflow-y-auto w-full px-4 sm:px-12 py-12 scroll-smooth">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4 flex justify-between items-start flex-shrink-0">
            <div className="flex-1 mr-4">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') setIsRenaming(false);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleRename}
                    disabled={saving}
                    className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsRenaming(false)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {metadata.title || filePath.split('/').pop()?.replace('.md', '')}
                  </h1>
                  {metadata.date && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">{metadata.date}</p>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isAdmin && !isEditing && !isRenaming && (
                <>
                  <button
                    onClick={() => {
                      setRenameValue(filePath.split('/').pop() || '');
                      setIsRenaming(true);
                    }}
                    className="p-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Rename File"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="p-2 text-zinc-500 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Edit Content"
                  >
                    <AlignLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Delete File"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEditToggle}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setIsTocOpen(!isTocOpen)}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors xl:hidden"
                title="Toggle Table of Contents"
              >
                <AlignLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full min-h-[500px] p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 transition-colors prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:border prose-pre:border-zinc-800 pb-12">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                  components={{
                    h1: HeadingRenderer,
                    h2: HeadingRenderer,
                    h3: HeadingRenderer,
                    h4: HeadingRenderer,
                    a: LinkRenderer,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </article>
            )}
          </div>
          
          {/* Gitbook style pagination footer */}
          {!isEditing && !isRenaming && (prevFile || nextFile) && (
            <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
              {prevFile ? (
                <button
                  onClick={() => onNavigate && onNavigate(prevFile)}
                  className="flex flex-col items-start p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all w-full sm:w-1/2 text-left group"
                >
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">Previous</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate w-full text-base">{prevFile.split('/').pop()?.replace('.md', '').replace('.pdf', '')}</span>
                </button>
              ) : <div className="w-full sm:w-1/2" />}
              
              {nextFile ? (
                <button
                  onClick={() => onNavigate && onNavigate(nextFile)}
                  className="flex flex-col items-end p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all w-full sm:w-1/2 text-right group"
                >
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">Next</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate w-full text-base">{nextFile.split('/').pop()?.replace('.md', '').replace('.pdf', '')}</span>
                </button>
              ) : <div className="w-full sm:w-1/2" />}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Table of Contents */}
      {!isEditing && (
        <div 
          className={`${isTocOpen ? 'w-64 border-l' : 'w-0 border-transparent'} transition-all duration-300 ease-in-out border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 overflow-hidden flex-shrink-0 hidden xl:block z-10`}
        >
          <div className="w-64 h-full flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm tracking-wide uppercase">On this page</span>
              <button 
                onClick={() => setIsTocOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-sm">
              {toc.length === 0 ? (
                <p className="text-zinc-400 italic">No headings found.</p>
              ) : (
                <ul className="space-y-2">
                  {toc.map((item, idx) => (
                    <li 
                      key={idx} 
                      style={{ marginLeft: `${(item.level - 1) * 12}px` }}
                      className="line-clamp-2"
                    >
                      <a 
                        href={`#${item.id}`} 
                        className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle button when closed on desktop */}
      {!isTocOpen && !isEditing && (
        <button
          onClick={() => setIsTocOpen(true)}
          className="hidden xl:flex absolute top-4 right-4 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all z-20"
          title="Show Table of Contents"
        >
          <AlignLeft className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
