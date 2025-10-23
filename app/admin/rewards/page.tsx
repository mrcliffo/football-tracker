'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Trophy, Award, Crown, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Reward } from '@/lib/types/database';

export default function RewardsManagementPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rewardType: 'match' as 'match' | 'season' | 'leadership',
    criteriaEventType: null as 'goal' | 'assist' | 'tackle' | 'save' | null,
    criteriaThreshold: 1,
    criteriaScope: 'single_match' as 'single_match' | 'season' | 'career' | 'special',
    icon: '',
  });

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const response = await fetch('/api/admin/rewards');
      if (!response.ok) throw new Error('Failed to load rewards');
      const data = await response.json();
      setRewards(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load rewards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        name: reward.name,
        description: reward.description,
        rewardType: reward.reward_type,
        criteriaEventType: reward.criteria_event_type,
        criteriaThreshold: reward.criteria_threshold,
        criteriaScope: reward.criteria_scope,
        icon: reward.icon || '',
      });
    } else {
      setEditingReward(null);
      setFormData({
        name: '',
        description: '',
        rewardType: 'match',
        criteriaEventType: null,
        criteriaThreshold: 1,
        criteriaScope: 'single_match',
        icon: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Reward name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Reward description is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.criteriaScope !== 'special' && !formData.criteriaEventType) {
      toast({
        title: 'Validation Error',
        description: 'Event type is required for non-special rewards',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingReward
        ? `/api/admin/rewards/${editingReward.id}`
        : '/api/admin/rewards';

      const response = await fetch(url, {
        method: editingReward ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save reward');
      }

      toast({
        title: 'Success',
        description: `Reward ${editingReward ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      loadRewards();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${editingReward ? 'update' : 'create'} reward`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reward: Reward) => {
    if (!confirm(`Are you sure you want to delete "${reward.name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/rewards/${reward.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete reward');
      }

      toast({
        title: 'Success',
        description: 'Reward deleted successfully',
      });

      loadRewards();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete reward',
        variant: 'destructive',
      });
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Award className="h-4 w-4 text-blue-500" />;
      case 'season':
        return <Trophy className="h-4 w-4 text-purple-500" />;
      case 'leadership':
        return <Crown className="h-4 w-4 text-amber-500" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'single_match':
        return 'Single Match';
      case 'season':
        return 'Season';
      case 'career':
        return 'Career';
      case 'special':
        return 'Special';
      default:
        return scope;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rewards Management</h2>
          <p className="text-muted-foreground">
            Manage rewards that players can earn for their achievements
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReward ? 'Edit Reward' : 'Add Reward'}
              </DialogTitle>
              <DialogDescription>
                {editingReward
                  ? 'Update the details of this reward'
                  : 'Create a new reward for players to earn'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Reward Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Hat Trick Hero"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Score 3 or more goals in a single match"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rewardType">Reward Type</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value: 'match' | 'season' | 'leadership') =>
                      setFormData({ ...formData, rewardType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">Match-Based</SelectItem>
                      <SelectItem value="season">Season-Based</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criteriaScope">Criteria Scope</Label>
                  <Select
                    value={formData.criteriaScope}
                    onValueChange={(value: 'single_match' | 'season' | 'career' | 'special') =>
                      setFormData({ ...formData, criteriaScope: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_match">Single Match</SelectItem>
                      <SelectItem value="season">Season</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="criteriaEventType">Event Type</Label>
                  <Select
                    value={formData.criteriaEventType || 'none'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        criteriaEventType: value === 'none' ? null : (value as 'goal' | 'assist' | 'tackle' | 'save'),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Special)</SelectItem>
                      <SelectItem value="goal">Goal</SelectItem>
                      <SelectItem value="assist">Assist</SelectItem>
                      <SelectItem value="tackle">Tackle</SelectItem>
                      <SelectItem value="save">Save</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.criteriaScope !== 'special' && !formData.criteriaEventType && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Required for non-special rewards
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criteriaThreshold">Threshold</Label>
                  <Input
                    id="criteriaThreshold"
                    type="number"
                    min="1"
                    placeholder="e.g., 3"
                    value={formData.criteriaThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        criteriaThreshold: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of events required
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  placeholder="e.g., 🏆 ⚽ 🎯"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  maxLength={10}
                />
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-sm font-semibold mb-2">Preview</h4>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{formData.icon || '🏆'}</span>
                  <div>
                    <p className="font-semibold">{formData.name || 'Reward Name'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.description || 'Description goes here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.criteriaEventType ? (
                        <>
                          {formData.criteriaThreshold} {formData.criteriaEventType}
                          {formData.criteriaThreshold > 1 ? 's' : ''} • {getScopeLabel(formData.criteriaScope)}
                        </>
                      ) : (
                        <>Special criteria • {getScopeLabel(formData.criteriaScope)}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Reward'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rewards</CardTitle>
          <CardDescription>
            {rewards.length} reward{rewards.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No rewards configured. Add your first reward to get started.
                  </TableCell>
                </TableRow>
              ) : (
                rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="text-2xl">{reward.icon || '🏆'}</TableCell>
                    <TableCell className="font-medium">{reward.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {reward.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRewardTypeIcon(reward.reward_type)}
                        <span className="capitalize">{reward.reward_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {reward.criteria_event_type ? (
                        <div className="space-y-1">
                          <div>
                            {reward.criteria_threshold} {reward.criteria_event_type}
                            {reward.criteria_threshold > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getScopeLabel(reward.criteria_scope)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          Special • {getScopeLabel(reward.criteria_scope)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(reward)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reward)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
