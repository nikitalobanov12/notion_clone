"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardHeader, CardTitle} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MoreHorizontal, Edit, UserPlus, Settings } from "lucide-react";

interface Workspace {
  id: number;
  name: string;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: workspaces = [], isLoading, error, refetch } = api.workspace.getWorkspaces.useQuery();
  const createWorkspace = api.workspace.createWorkspace.useMutation({ 
    onSuccess: () => void refetch(),
    onError: (error) => {
      console.error('Failed to create workspace:', error);
    }
  });
  const inviteUser = api.workspace.inviteUser.useMutation({
    onSuccess: () => {
      setEmail("");
      setShowInvite(false);
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    },
    onError: (error) => {
      setInviteError(error.message);
      setTimeout(() => setInviteError(""), 5000);
    }
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [email, setEmail] = useState("");
  const [wsName, setWsName] = useState("");
  const [newName, setNewName] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleCreate = async () => {
    if (wsName.trim()) {
      try {
        await createWorkspace.mutateAsync({ name: wsName });
        setWsName("");
        setShowCreate(false);
      } catch (error) {
        console.error('Failed to create workspace:', error);
      }
    }
  };

  const handleInvite = async () => {
    if (currentWorkspace && email.trim()) {
      setInviteError("");
      try {
        await inviteUser.mutateAsync({ 
          workspaceId: currentWorkspace.id, 
          email: email.trim() 
        });
      } catch (error) {
        // Error handling is done in the mutation onError callback
        console.error(error)
      }
    }
  };

  const handleCardClick = (workspaceId: number) => {
    router.push(`/workspaces/${workspaceId}`);
  };

  const openInviteDialog = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setEmail("");
    setInviteError("");
    setShowInvite(true);
  };

  const openRenameDialog = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setNewName(workspace.name);
    setShowRename(true);
  };

  const closeInviteDialog = () => {
    setShowInvite(false);
    setCurrentWorkspace(null);
    setEmail("");
    setInviteError("");
  };

  const closeRenameDialog = () => {
    setShowRename(false);
    setCurrentWorkspace(null);
    setNewName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Workspaces</h1>
          <p className="text-muted-foreground mt-1">
            Manage and collaborate in your workspaces
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>New Workspace</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Enter workspace name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && wsName.trim()) {
                      void handleCreate();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => void handleCreate()}
                disabled={createWorkspace.status === 'pending' || !wsName.trim()}
              >
                {createWorkspace.status === 'pending' ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {inviteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">Invitation sent successfully!</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading workspaces...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">
            {error instanceof Error ? error.message : 'Failed to load workspaces'}
          </p>
        </div>
      )}

      {/* Workspaces Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card 
              key={workspace.id} 
              className="group relative cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => handleCardClick(workspace.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {workspace.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(workspace);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Rename workspace
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          openInviteDialog(workspace);
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite users
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement workspace settings
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && workspaces.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg mb-2">No workspaces yet</p>
            <p className="mb-4">Create your first workspace to get started</p>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button>Create Your First Workspace</Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      )}

      {/* Invite User Dialog */}
      <Dialog open={showInvite} onOpenChange={closeInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite User to {currentWorkspace?.name}</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate in this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && email.trim()) {
                    void handleInvite();
                  }
                }}
              />
              {inviteError && (
                <p className="text-sm text-red-600">{inviteError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeInviteDialog}>
              Cancel
            </Button>
            <Button 
              onClick={() => void handleInvite()}
              disabled={inviteUser.status === 'pending' || !email.trim()}
            >
              {inviteUser.status === 'pending' ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Workspace Dialog */}
      <Dialog open={showRename} onOpenChange={closeRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
                          <DialogDescription>
                Change the name of &ldquo;{currentWorkspace?.name}&rdquo;.
              </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">New Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new workspace name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    // TODO: Implement rename functionality
                    closeRenameDialog();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRenameDialog}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // TODO: Implement rename functionality
                closeRenameDialog();
              }}
              disabled={!newName.trim() || newName === currentWorkspace?.name}
            >
              Rename Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
