'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from "@/context/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { Toaster } from "@/components/ui/toaster";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <AuthProvider>
      <WorkspaceProvider>
        {children}
        <Toaster />
      </WorkspaceProvider>
    </AuthProvider>
  );
}