"use client";

import React from 'react';
import { X, Settings as SettingsIcon, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session, status } = useSession();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 relative border border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Settings
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Authenticate with GitHub to edit and upload markdown files to your repository.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex flex-col items-center text-center">
            {status === 'loading' ? (
              <p className="text-zinc-500">Loading...</p>
            ) : session ? (
              <>
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-zinc-200 dark:border-zinc-700">
                  <img src={session.user?.image || ''} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{session.user?.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{session.user?.email}</p>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <span className="text-4xl mb-3">🐱</span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Not Authenticated</h3>
                <p className="text-sm text-zinc-500 mb-4">You need to sign in to edit content.</p>
                <button
                  onClick={() => signIn('github')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#24292F] hover:bg-[#24292F]/90 rounded-md transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in with GitHub
                </button>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
