import React from 'react';
import { Sidebar } from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 pt-16">
        <main className="p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
