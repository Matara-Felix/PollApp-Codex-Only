import { useEffect, useMemo, useState } from 'react';
import { Clipboard, CheckCircle2 } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingState from '../components/LoadingState';
import ResultsChart from '../components/ResultsChart';
import { calculateResults, castVote, fetchPoll, fetchVotes } from '../lib/polls';
import { supabase } from '../lib/supabase';
import type { PollResults, PollWithOptions, Vote } from '../types/database';

function getSessionId() {
  const key = 'pulsepoll_session_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

export default function VotePage() {
  const { pollId } = useParams();
  const location = useLocation();
  const [poll, setPoll] = useState<PollWithOptions | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const voteStorageKey = pollId ? `pulsepoll_voted_${pollId}` : '';
  const hasVoted = voteStorageKey ? localStorage.getItem(voteStorageKey) === 'true' : false;
  const [showResults, setShowResults] = useState(hasVoted);
  const shareLink = (location.state as { createdLink?: string } | null)?.createdLink ?? window.location.href;

  const results: PollResults | null = useMemo(() => {
    if (!poll) return null;
    return calculateResults(poll.options, votes);
  }, [poll, votes]);

  useEffect(() => {
    if (!pollId) return;
    const activePollId = pollId;

    async function loadPoll() {
      try {
        const [pollData, voteData] = await Promise.all([fetchPoll(activePollId), fetchVotes(activePollId)]);
        setPoll(pollData);
        setVotes(voteData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Poll not found.');
      } finally {
        setLoading(false);
      }
    }

    loadPoll();

    const channel = supabase
      .channel(`poll-results-${pollId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `poll_id=eq.${activePollId}` },
        (payload) => {
          setVotes((current) => {
            const nextVote = payload.new as Vote;
            if (current.some((vote) => vote.id === nextVote.id)) return current;
            return [...current, nextVote];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  async function handleVote(optionId: string) {
    if (!pollId || hasVoted) return;
    setVoting(true);
    try {
      await castVote(pollId, optionId, getSessionId());
      localStorage.setItem(voteStorageKey, 'true');
      setShowResults(true);
      toast.success('Vote counted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save vote.');
    } finally {
      setVoting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink);
    toast.success('Link copied');
  }

  if (loading) return <LoadingState label="Loading poll" />;
  if (!poll) return <div className="rounded-xl bg-white p-6 shadow-soft">Poll not found.</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-blue-700">Public poll</p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-slate-950">{poll.question}</h1>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Clipboard size={16} />
            Copy link
          </button>
        </div>

        {!showResults ? (
          <div className="mt-7 grid gap-3">
            {poll.options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={voting}
                onClick={() => handleVote(option.id)}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {option.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <CheckCircle2 size={18} />
              Results update live
            </div>
            {results && <ResultsChart results={results} />}
          </div>
        )}
      </div>
    </div>
  );
}
