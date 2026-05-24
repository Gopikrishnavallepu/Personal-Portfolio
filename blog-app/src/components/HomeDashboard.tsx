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

interface PostItem {
  title: string;
  date: string;
  category: string;
  focus: string;
  excerpt: string;
  path: string;
  type: 'md' | 'pdf';
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
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: session } = useSession();
  const isAdmin = !!session;

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (data.tree) setTree(data.tree);
        if (data.posts) setPosts(data.posts);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load file tree', err);
        setLoading(false);
      });
  }, [refreshKey]);

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

  // Filter posts based on selected category
  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'All') return true;
    return post.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 sm:px-12 w-full">
      {/* Welcome Banner */}
      <div className="mb-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              DevSecOps & Cloud Security Portfolio
            </h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl leading-relaxed">
            Welcome to my central knowledge base and project portfolio. This platform serves as a living repository of my work in Cloud Security, DevSecOps, and Threat Hunting.
          </p>
        </div>
        <div className="p-8 grid sm:grid-cols-3 gap-6 bg-zinc-50 dark:bg-zinc-950/50">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <span>☁️</span> Cloud Security
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Comprehensive security playbooks, CNAPP architecture notes, and IAM best practices for AWS.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <span>🐳</span> Container & K8s
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Deep dives into securing EKS, ECS, Docker hardening, and mitigating MITRE ATT&CK scenarios.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <span>🎯</span> Interview Prep
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Consolidated question banks, cheat sheets, and architecture challenges for DevSecOps roles.</p>
          </div>
        </div>
      </div>

      {/* Directory Browser - Moved to Top */}
      <div className="mb-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden">
        <h2 className="text-xl font-bold mb-4 text-zinc-800 dark:text-zinc-200 flex items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <Folder className="w-6 h-6 mr-3 text-blue-500" />
          Workspace Directory
        </h2>
        <div className="overflow-y-auto max-h-[40vh] pr-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-zinc-500 animate-pulse">Scanning directories...</div>
          ) : (
            tree.map((node, idx) => (
              <DashboardTreeNode key={idx} node={node} onSelectFile={onSelectFile} />
            ))
          )}
        </div>
      </div>

      {/* Category Filter Tags */}
      <section className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Filter by Category</h2>
        <div className="flex flex-wrap gap-2">
          {['All', 'CloudSecurity', 'DevSecOps', 'DataAnalytics', 'InterviewPrep'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Article Cards Grid/List Feed */}
      <section className="posts-list flex flex-col gap-6 mb-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            No guides found in this category.
          </div>
        ) : (
          filteredPosts.map((post, idx) => (
            <article 
              key={idx} 
              className="post p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:translate-y-[-2px] hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
              onClick={() => onSelectFile(post.path)}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                  <time className="text-xs text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap ml-4">
                    {post.date}
                  </time>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100/20 dark:border-blue-900/30">
                    {post.category}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/30">
                    {post.focus}
                  </span>
                </div>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                  Read Guide →
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  {post.type}
                </span>
              </div>
            </article>
          ))
        )}
      </section>

    </div>
  );
}
