"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { useToast } from '@/hooks/use-toast';

export type WorkspaceRole = 'admin' | 'workspace' | 'workspace_user' | 'developer' | 'lawyer' | 'rental_company';

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
  const [currentUser] = useSessionStorage<any>('currentUser', null);
  const [activeWorkspace, setActiveWorkspace] = useSessionStorage<string | null>('activeWorkspace', initialWorkspaceId || null);
  const [role, setRole] = useSessionStorage<WorkspaceRole>('role', currentUser?.role || initialRole);
  const [workspaceName, setWorkspaceName] = useSessionStorage<string>('workspaceName', initialWorkspaceName);
  const [contactType, setContactType] = useSessionStorage<string | undefined>('contactType', initialContactType);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Debounce timer for toast notifications
  const toastTimerRef = React.useRef<NodeJS.Timeout>();

  // Generate display name based on current workspace
  const displayName = activeWorkspace && activeWorkspace !== 'MAIN' 
    ? `${contactType || 'Client'}: ${workspaceName} Workspace`
    : 'Main Workspace';

  const switchWorkspace = useCallback((workspaceId: string | null, newWorkspaceName?: string) => {
    setIsLoading(true);
    
    // Clear any pending toast
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    if (workspaceId && workspaceId !== 'MAIN') {
      setActiveWorkspace(workspaceId);
      if (newWorkspaceName) {
        setWorkspaceName(newWorkspaceName);
      }
      
      // Debounce toast notification
      toastTimerRef.current = setTimeout(() => {
        toast({
          title: "Workspace switched",
          description: `Now viewing ${newWorkspaceName || 'workspace'} data`,
        });
      }, 100);
    } else {
      setActiveWorkspace('MAIN');
      setWorkspaceName('Main Workspace');
      setContactType(undefined);
      
      // Debounce toast notification
      toastTimerRef.current = setTimeout(() => {
        toast({
          title: "Switched to Main Workspace",
          description: "Now viewing all cases across all workspaces",
        });
      }, 100);
    }
    
    setIsLoading(false);
  }, [setActiveWorkspace, setWorkspaceName, setContactType, toast]);

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
  
  // Update role when current user changes
  useEffect(() => {
    if (currentUser?.role) {
      setRole(currentUser.role);
      
      // If user is workspace_user, set their workspace as active
      if (currentUser.role === 'workspace_user' && currentUser.workspaceId) {
        setActiveWorkspace(currentUser.workspaceId);
      }
    }
  }, [currentUser, setRole, setActiveWorkspace]);
  
  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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