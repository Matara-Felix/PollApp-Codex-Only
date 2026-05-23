import { supabase } from './supabase';
import type { Poll, PollOption, PollResults, PollWithOptions, Vote } from '../types/database';

export async function createPoll(question: string, options: string[]) {
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({ question: question.trim() })
    .select()
    .single<Poll>();

  if (pollError) throw pollError;

  const optionRows = options.map((text, index) => ({
    poll_id: poll.id,
    text: text.trim(),
    position: index + 1,
  }));

  const { error: optionsError } = await supabase.from('options').insert(optionRows);
  if (optionsError) throw optionsError;

  return poll;
}

export async function fetchPoll(pollId: string): Promise<PollWithOptions> {
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single<Poll>();

  if (pollError) throw pollError;

  const { data: options, error: optionsError } = await supabase
    .from('options')
    .select('*')
    .eq('poll_id', pollId)
    .order('position', { ascending: true })
    .returns<PollOption[]>();

  if (optionsError) throw optionsError;

  return { ...poll, options: options ?? [] };
}

export async function fetchVotes(pollId: string) {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('poll_id', pollId)
    .returns<Vote[]>();

  if (error) throw error;
  return data ?? [];
}

export async function fetchPollResults(pollId: string): Promise<PollResults> {
  const poll = await fetchPoll(pollId);
  const votes = await fetchVotes(pollId);
  return calculateResults(poll.options, votes);
}

export function calculateResults(options: PollOption[], votes: Vote[]): PollResults {
  const totalVotes = votes.length;
  const counts = votes.reduce<Record<string, number>>((acc, vote) => {
    acc[vote.option_id] = (acc[vote.option_id] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalVotes,
    options: options.map((option) => {
      const voteCount = counts[option.id] ?? 0;
      return {
        ...option,
        votes: voteCount,
        percentage: totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100),
      };
    }),
  };
}

export async function castVote(pollId: string, optionId: string, voterSession: string) {
  const { error } = await supabase.from('votes').insert({
    poll_id: pollId,
    option_id: optionId,
    voter_session: voterSession,
  });

  if (error) throw error;
}

export async function fetchAllPolls() {
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Poll[]>();

  if (pollsError) throw pollsError;

  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('poll_id')
    .returns<Pick<Vote, 'poll_id'>[]>();

  if (votesError) throw votesError;

  const counts = (votes ?? []).reduce<Record<string, number>>((acc, vote) => {
    acc[vote.poll_id] = (acc[vote.poll_id] ?? 0) + 1;
    return acc;
  }, {});

  return (polls ?? []).map((poll) => ({
    ...poll,
    voteCount: counts[poll.id] ?? 0,
  }));
}

export async function deletePoll(pollId: string) {
  const { error } = await supabase.from('polls').delete().eq('id', pollId);
  if (error) throw error;
}
