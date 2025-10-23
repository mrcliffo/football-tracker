import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

interface RouteParams {
  params: Promise<{
    teamId: string;
    matchId: string;
  }>;
}

/**
 * GET /api/teams/[teamId]/matches/[matchId]/report
 * Fetch existing match report
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { teamId, matchId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify match exists and belongs to team
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, status, team_id')
      .eq('id', matchId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if user has access (manager or parent)
    const { data: team } = await supabase
      .from('teams')
      .select('manager_id')
      .eq('id', teamId)
      .single();

    const isManager = team?.manager_id === user.id;

    if (!isManager) {
      // Check if user is a parent with access to this team
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!teamMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch existing report
    const { data: existingReport, error: reportError } = await supabase
      .from('match_reports')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();

    if (reportError) {
      console.error('Error fetching match report:', reportError);
      return NextResponse.json(
        { error: 'Failed to fetch match report' },
        { status: 500 }
      );
    }

    if (!existingReport) {
      return NextResponse.json({ error: 'No report found' }, { status: 404 });
    }

    return NextResponse.json(existingReport);
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/matches/[matchId]/report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[teamId]/matches/[matchId]/report
 * Generate or regenerate AI match report
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { teamId, matchId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify match exists and belongs to team
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, opponent_name, match_date, status, team_id')
      .eq('id', matchId)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify user is the team manager (only managers can generate reports)
    const { data: team } = await supabase
      .from('teams')
      .select('manager_id')
      .eq('id', teamId)
      .single();

    if (team?.manager_id !== user.id) {
      return NextResponse.json(
        { error: 'Only team managers can generate match reports' },
        { status: 403 }
      );
    }

    // Only generate report for completed matches
    if (match.status !== 'completed') {
      return NextResponse.json(
        { error: 'Report can only be generated for completed matches' },
        { status: 400 }
      );
    }

    // Fetch match data for report generation
    const { data: matchPlayers } = await supabase
      .from('match_players')
      .select(`
        player:players(id, name, squad_number, position),
        is_captain
      `)
      .eq('match_id', matchId);

    // Fetch match events
    const { data: matchEvents } = await supabase
      .from('match_events')
      .select(`
        event_type,
        player:players(name, squad_number)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    // Fetch player of the match award
    const { data: potmAward } = await supabase
      .from('match_awards')
      .select(`
        player:players(name, squad_number),
        notes
      `)
      .eq('match_id', matchId)
      .eq('award_type', 'player_of_match')
      .maybeSingle();

    // Generate AI report
    const reportText = await generateMatchReport({
      opponent: match.opponent_name,
      date: match.match_date,
      players: matchPlayers || [],
      events: matchEvents || [],
      potm: potmAward,
    });

    // Check if report already exists
    const { data: existingReport } = await supabase
      .from('match_reports')
      .select('id')
      .eq('match_id', matchId)
      .maybeSingle();

    let report;
    if (existingReport) {
      // Update existing report
      const { data: updatedReport, error: updateError } = await supabase
        .from('match_reports')
        .update({
          report_text: reportText,
          generated_at: new Date().toISOString(),
        })
        .eq('id', existingReport.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating match report:', updateError);
        return NextResponse.json(
          { error: 'Failed to update match report' },
          { status: 500 }
        );
      }
      report = updatedReport;
    } else {
      // Create new report
      const { data: newReport, error: insertError } = await supabase
        .from('match_reports')
        .insert({
          match_id: matchId,
          report_text: reportText,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving match report:', insertError);
        return NextResponse.json(
          { error: 'Failed to save match report' },
          { status: 500 }
        );
      }
      report = newReport;
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/matches/[matchId]/report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateMatchReport(data: {
  opponent: string;
  date: string;
  players: any[];
  events: any[];
  potm: any;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    // Return a fallback report if API key is not configured
    return generateFallbackReport(data);
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Find captain
    const captain = data.players.find((p: any) => p.is_captain);

    // Count events by player
    const eventsByPlayer: Record<string, Record<string, number>> = {};
    data.events.forEach((event: any) => {
      const playerName = event.player?.name || 'Unknown';
      if (!eventsByPlayer[playerName]) {
        eventsByPlayer[playerName] = {};
      }
      eventsByPlayer[playerName][event.event_type] =
        (eventsByPlayer[playerName][event.event_type] || 0) + 1;
    });

    // Build match summary for prompt
    const matchSummary = {
      opponent: data.opponent,
      date: new Date(data.date).toLocaleDateString(),
      squadSize: data.players.length,
      captain: captain?.player?.name || 'Not assigned',
      eventSummary: eventsByPlayer,
      playerOfMatch: data.potm?.player?.name,
      potmNotes: data.potm?.notes,
    };

    const prompt = `You are a youth football coach writing a match report for parents. Write a warm, encouraging narrative about the match.

Match Details:
- Opponent: ${matchSummary.opponent}
- Date: ${matchSummary.date}
- Squad Size: ${matchSummary.squadSize} players
- Captain: ${matchSummary.captain}
${matchSummary.playerOfMatch ? `- Player of the Match: ${matchSummary.playerOfMatch}` : ''}

Events logged during the match:
${JSON.stringify(matchSummary.eventSummary, null, 2)}

${matchSummary.potmNotes ? `Coach's notes on Player of the Match: ${matchSummary.potmNotes}` : ''}

Write a 2-3 paragraph match report that:
1. Describes the team's overall performance in an encouraging tone
2. Highlights key moments and standout players (mention specific players by name)
3. Mentions the captain's leadership
4. Celebrates the Player of the Match if awarded
5. Is suitable for parents to read (positive, constructive, age-appropriate)

Keep the tone warm, encouraging, and focused on development and effort rather than just results.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a youth football coach writing positive, encouraging match reports for parents.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || generateFallbackReport(data);
  } catch (error) {
    console.error('Error generating AI report:', error);
    return generateFallbackReport(data);
  }
}

function generateFallbackReport(data: {
  opponent: string;
  date: string;
  players: any[];
  events: any[];
  potm: any;
}): string {
  const captain = data.players.find((p: any) => p.is_captain);
  const dateStr = new Date(data.date).toLocaleDateString();

  let report = `Match Report: vs ${data.opponent}\n\n`;
  report += `Date: ${dateStr}\n\n`;
  report += `Our team put in a great effort against ${data.opponent}. `;
  report += `With ${data.players.length} players taking to the field, `;

  if (captain) {
    report += `captain ${captain.player.name} led the team with determination. `;
  }

  if (data.events.length > 0) {
    report += `The match was filled with action, with the team showing great energy and commitment throughout. `;
  }

  if (data.potm) {
    report += `\n\nSpecial recognition goes to ${data.potm.player.name} for an outstanding performance, earning the Player of the Match award. `;
    if (data.potm.notes) {
      report += `${data.potm.notes}`;
    }
  }

  report += `\n\nAll players showed excellent teamwork and sportsmanship. Well done to everyone involved!`;

  return report;
}
