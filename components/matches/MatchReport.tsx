'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface MatchReportProps {
  teamId: string;
  matchId: string;
  canGenerate?: boolean; // Only managers can generate reports
}

interface MatchReport {
  id: string;
  match_id: string;
  report_text: string;
  generated_at: string;
  created_at: string;
}

export function MatchReport({ teamId, matchId, canGenerate = false }: MatchReportProps) {
  const [report, setReport] = useState<MatchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [teamId, matchId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/report`);

      if (!response.ok) {
        if (response.status === 404) {
          // No report exists yet - this is normal, not an error
          setReport(null);
          setError(null);
        } else {
          // Other errors
          const data = await response.json().catch(() => ({ error: 'Failed to fetch match report' }));
          setError(data.error || 'Failed to load match report');
          setReport(null);
        }
      } else {
        const data = await response.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching match report:', err);
      // Don't show error to user if it's just that no report exists yet
      setReport(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/report`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate match report');
        toast.error(data.error || 'Failed to generate match report');
        return;
      }

      const data = await response.json();
      setReport(data);
      toast.success(report ? 'Match report regenerated successfully' : 'Match report generated successfully');
    } catch (err) {
      console.error('Error generating match report:', err);
      setError('Failed to generate match report');
      toast.error('Failed to generate match report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading match report...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Match Report
          </CardTitle>
          <CardDescription>
            AI-generated narrative summary of the match
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {canGenerate
                ? 'No match report available yet.'
                : 'The coach will generate a match report soon.'}
            </p>
            {canGenerate && (
              <Button onClick={generateReport} disabled={generating}>
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Match Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Match Report
            </CardTitle>
            <CardDescription>
              Generated on {new Date(report.generated_at).toLocaleDateString()} at{' '}
              {new Date(report.generated_at).toLocaleTimeString()}
            </CardDescription>
          </div>
          {canGenerate && (
            <Button
              onClick={generateReport}
              disabled={generating}
              variant="outline"
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {report.report_text}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
