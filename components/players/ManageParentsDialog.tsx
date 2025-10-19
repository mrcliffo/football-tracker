'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Users, X, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const linkParentSchema = z.object({
  parentEmail: z.string().email('Please enter a valid email address'),
});

type LinkParentFormData = z.infer<typeof linkParentSchema>;

interface ParentLink {
  linkId: string;
  userId: string;
  fullName: string;
  role: string;
  linkedAt: string;
}

interface ManageParentsDialogProps {
  teamId: string;
  playerId: string;
  playerName: string;
}

export function ManageParentsDialog({
  teamId,
  playerId,
  playerName,
}: ManageParentsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parents, setParents] = useState<ParentLink[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [removingLinkId, setRemovingLinkId] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [linkToRemove, setLinkToRemove] = useState<ParentLink | null>(null);

  const form = useForm<LinkParentFormData>({
    resolver: zodResolver(linkParentSchema),
    defaultValues: {
      parentEmail: '',
    },
  });

  // Fetch linked parents when dialog opens
  useEffect(() => {
    if (open) {
      fetchParents();
    }
  }, [open]);

  const fetchParents = async () => {
    setLoadingParents(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/players/${playerId}/parents`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch linked parents');
      }

      const data = await response.json();
      setParents(data.parents || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast.error('Failed to load linked parents');
    } finally {
      setLoadingParents(false);
    }
  };

  const onSubmit = async (data: LinkParentFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/players/${playerId}/parents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link parent');
      }

      const result = await response.json();
      toast.success(`Parent linked successfully!`);
      form.reset();

      // Add the new link to the list
      setParents([...parents, result.link]);

      router.refresh();
    } catch (error) {
      console.error('Error linking parent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to link parent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveClick = (parent: ParentLink) => {
    setLinkToRemove(parent);
    setShowRemoveDialog(true);
  };

  const handleRemoveConfirm = async () => {
    if (!linkToRemove) return;

    setRemovingLinkId(linkToRemove.linkId);
    setShowRemoveDialog(false);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/players/${playerId}/parents/${linkToRemove.linkId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove parent link');
      }

      toast.success('Parent link removed successfully');

      // Remove from the list
      setParents(parents.filter((p) => p.linkId !== linkToRemove.linkId));

      router.refresh();
    } catch (error) {
      console.error('Error removing parent link:', error);
      toast.error('Failed to remove parent link');
    } finally {
      setRemovingLinkId(null);
      setLinkToRemove(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Manage Parents
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Parent Access</DialogTitle>
            <DialogDescription>
              Link parents to {playerName} so they can view their child's statistics and
              match history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add Parent Form */}
            <div>
              <h3 className="text-sm font-medium mb-3">Link a Parent</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="parentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent's Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="parent@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the email address the parent used to register their account.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      'Link Parent'
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Linked Parents List */}
            <div>
              <h3 className="text-sm font-medium mb-3">Linked Parents</h3>
              {loadingParents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : parents.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No parents linked yet. Link a parent above to give them access.
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {parents.map((parent) => (
                    <Card key={parent.linkId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{parent.fullName || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              Linked {new Date(parent.linkedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">{parent.role}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClick(parent)}
                          disabled={removingLinkId === parent.linkId}
                        >
                          {removingLinkId === parent.linkId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Parent Access?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {linkToRemove?.fullName}'s access to{' '}
              {playerName}? They will no longer be able to view this player's statistics
              or match history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLinkToRemove(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
