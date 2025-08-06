'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface Workspace {
  id: string;
  name: string;
  type?: string;
}

interface Contact {
  id: string;
  name: string;
  company?: string;
  type: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    workspace_id: '',
    contact_id: '',
    send_email: true
  });
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    credentials?: { email: string; password: string };
    validation?: { loginSuccess: boolean; user: any; message: string };
  } | null>(null);

  useEffect(() => {
    fetchWorkspaces();
    fetchContacts();
    generateTempPassword();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      const data = await response.json();
      // API returns array directly, not wrapped in success/data
      if (Array.isArray(data)) {
        setWorkspaces(data);
      } else if (data.success) {
        setWorkspaces(data.workspaces || []);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      // API returns array directly, not wrapped in success/data
      if (Array.isArray(data)) {
        setContacts(data);
      } else if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(password);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Temp password:', tempPassword);
    
    // Validate required fields
    if (!formData.email || !formData.role) {
      setResult({
        success: false,
        message: 'Please fill in all required fields'
      });
      return;
    }
    
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        ...formData,
        password: tempPassword,
        workspace_id: formData.workspace_id === 'none' || !formData.workspace_id ? null : formData.workspace_id,
        contact_id: formData.contact_id === 'none' || !formData.contact_id ? null : formData.contact_id
      };
      
      console.log('Sending payload:', payload);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(data);

      if (data.success) {
        // If email was sent, redirect after 3 seconds
        // If email wasn't sent, stay to show credentials
        if (formData.send_email) {
          setTimeout(() => {
            router.push('/users');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setResult({
        success: false,
        message: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/users">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
        <p className="text-muted-foreground mt-2">
          Add a new user to the PBike Rescue system
        </p>
      </div>

      {result && (
        <Card className={`mb-6 ${
          result.success 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>
            {result.success && result.validation && (
              <div className="flex items-center gap-2 mt-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Password verified - User can log in immediately
                </span>
              </div>
            )}
            {result.success && formData.send_email && (
              <p className="text-sm text-green-700 mt-2">
                Login credentials have been sent to {formData.email}
              </p>
            )}
            {result.success && !formData.send_email && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-300">
                <p className="font-medium text-sm mb-2 text-green-800">
                  ✅ Login Credentials Verified & Ready
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm font-mono">{formData.email}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm font-medium">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{tempPassword}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="h-6 px-2"
                      >
                        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3 border-t pt-2">
                  • User can log in immediately with these credentials<br/>
                  • They will be prompted to change password on first login<br/>
                  • Login has been verified and tested automatically
                </p>
              </div>
            )}
            {!result.success && (
              <div className="mt-2 p-3 bg-red-100 rounded-md">
                <p className="text-xs text-red-700">
                  Troubleshooting: Check console for detailed error logs
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Enter the details for the new user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="rental_company">Rental Company</SelectItem>
                  <SelectItem value="workspace_user">Workspace User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tempPassword">Temporary Password</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="tempPassword"
                  type="text"
                  value={tempPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateTempPassword}
                  title="Generate new password"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The user will be required to change this password on first login
              </p>
            </div>

            <div>
              <Label htmlFor="workspace">Workspace (Optional)</Label>
              <Select
                value={formData.workspace_id}
                onValueChange={(value) => setFormData({ ...formData, workspace_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No workspace restriction</SelectItem>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank for admin users or users with access to all data
              </p>
            </div>

            <div>
              <Label htmlFor="contact">Associated Contact (Optional)</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No associated contact</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `(${contact.company})`} - {contact.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_email"
                checked={formData.send_email}
                onCheckedChange={(checked) => setFormData({ ...formData, send_email: !!checked })}
              />
              <Label htmlFor="send_email" className="text-sm font-normal">
                Send login credentials via email
              </Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/users" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={loading || !formData.email || !formData.role} 
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}