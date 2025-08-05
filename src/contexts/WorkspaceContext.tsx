"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSessionStorage } from '@/hooks/use-session-storage';

export type WorkspaceRole = 'admin' | 'workspace';

export interface WorkspaceContextValue {
  id?: string;
  name: string;
  role: WorkspaceRole;
  contactType?: string;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string | null, workspaceName?: string) => void;
  backToMain: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
  initialWorkspaceId?: string;
  initialRole?: WorkspaceRole;
  initialWorkspaceName?: string;
  initialContactType?: string;
}

export function WorkspaceProvider({ 
  children, 
  initialWorkspaceId,
  initialRole = 'admin',
  initialWorkspaceName = 'Main Workspace',
  initialContactType
}: WorkspaceProviderProps) {
  const [activeWorkspace, setActiveWorkspace] = useSessionStorage<string | null>('activeWorkspace', initialWorkspaceId || null);
  const [role, setRole] = useSessionStorage<WorkspaceRole>('role', initialRole);
  const [workspaceName, setWorkspaceName] = useSessionStorage<string>('workspaceName', initialWorkspaceName);
  const [contactType, setContactType] = useSessionStorage<string | undefined>('contactType', initialContactType);
  const [isLoading, setIsLoading] = useState(false);

  // Generate display name based on current workspace
  const displayName = activeWorkspace && activeWorkspace !== 'MAIN' 
    ? `${contactType || 'Client'}: ${workspaceName} Workspace`
    : 'Main Workspace';

  const switchWorkspace = (workspaceId: string | null, newWorkspaceName?: string) => {
    setIsLoading(true);
    
    if (workspaceId && workspaceId !== 'MAIN') {
      setActiveWorkspace(workspaceId);
      if (newWorkspaceName) {
        setWorkspaceName(newWorkspaceName);
      }
    } else {
      setActiveWorkspace('MAIN');
      setWorkspaceName('Main Workspace');
      setContactType(undefined);
    }
    
    setIsLoading(false);
  };

  const backToMain = () => {
    switchWorkspace(null);
  };

  // Update workspace info when activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace === 'MAIN' || !activeWorkspace) {
      setWorkspaceName('Main Workspace');
      setContactType(undefined);
    }
  }, [activeWorkspace, setWorkspaceName, setContactType]);

  const contextValue: WorkspaceContextValue = {
    id: activeWorkspace === 'MAIN' ? undefined : activeWorkspace || undefined,
    name: displayName,
    role,
    contactType,
    isLoading,
    switchWorkspace,
    backToMain
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export { WorkspaceContext };