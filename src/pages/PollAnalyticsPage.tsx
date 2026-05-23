import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import LoadingState from '../components/LoadingState';
import ResultsChart from '../components/ResultsChart';
import { calculateResults, fetchPoll, fetchVotes } from '../lib/polls';
import { supabase } from '../lib/supabase';
import type { PollResults, PollWithOptions, Vote } from '../types/database';

export default function PollAnalyticsPage() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState<PollWithOptions | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  const results: PollResults | null = useMemo(() => {
    if (!poll) return null;
    return calculateResults(poll.options, votes);
  }, [poll, votes]);

  const winningOption = useMemo(() => {
    if (!results || results.options.length === 0) return null;
    return [...results.options].sort((a, b) => b.votes - a.votes)[0];
  }, [results]);

  useEffect(() => {
    if (!pollId) return;
    const activePollId = pollId;

    async function loadAnalytics() {
      try {
        const [pollData, voteData] = await Promise.all([fetchPoll(activePollId), fetchVotes(activePollId)]);
        setPoll(pollData);
        setVotes(voteData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();

    const channel = supabase
      .channel(`admin-analytics-${pollId}`)
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

  if (loading) return <LoadingState label="Loading analytics" />;
  if (!poll || !results) return <div className="rounded-xl bg-white p-6 shadow-soft">Poll not found.</div>;

  const chartData = results.options.map((option) => ({
    name: option.text.length > 18 ? `${option.text.slice(0, 18)}...` : option.text,
    votes: option.votes,
    percentage: option.percentage,
  }));

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl bg-white p-5 shadow-soft sm:p-6">
          <p className="text-sm font-semibold text-blue-700">Poll analytics</p>
          <h1 className="mt-2 break-words text-3xl font-bold tracking-tight">{poll.question}</h1>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="votes" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl bg-slate-950 p-5 text-white shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-300">Winning option</p>
                <p className="break-words text-lg font-semibold">{winningOption?.text ?? 'No votes yet'}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-sm text-slate-300">Total votes</p>
                <p className="mt-1 text-2xl font-bold">{results.totalVotes}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-sm text-slate-300">Top share</p>
                <p className="mt-1 text-2xl font-bold">{winningOption?.percentage ?? 0}%</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-5 rounded-xl bg-white p-5 shadow-soft sm:p-6">
        <h2 className="mb-4 text-xl font-semibold">Live results</h2>
        <ResultsChart results={results} />
      </section>
    </div>
  );
}
