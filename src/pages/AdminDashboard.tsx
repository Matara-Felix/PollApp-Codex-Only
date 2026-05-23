import { useEffect, useState } from 'react';
import { BarChart3, Calendar, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { deletePoll, fetchAllPolls } from '../lib/polls';

type DashboardPoll = Awaited<ReturnType<typeof fetchAllPolls>>[number];

export default function AdminDashboard() {
  const [polls, setPolls] = useState<DashboardPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DashboardPoll | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadPolls() {
    try {
      setPolls(await fetchAllPolls());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load polls.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolls();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePoll(deleteTarget.id);
      setPolls((current) => current.filter((poll) => poll.id !== deleteTarget.id));
      toast.success('Poll deleted');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete poll.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingState label="Loading dashboard" />;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">Admin dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Polls</h1>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Create poll
        </Link>
      </div>

      <div className="mt-6">
        {polls.length === 0 ? (
          <EmptyState title="No polls yet" body="Create a poll and it will appear here with vote counts." />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-soft">
            <div className="hidden grid-cols-[1fr_140px_190px_120px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid">
              <span>Question</span>
              <span>Votes</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_140px_190px_120px] md:items-center"
                >
                  <Link to={`/admin/polls/${poll.id}`} className="font-semibold text-slate-900 hover:text-blue-700">
                    {poll.question}
                  </Link>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <BarChart3 size={16} className="text-blue-600" />
                    {poll.voteCount}
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    {new Date(poll.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex justify-start gap-2 md:justify-end">
                    <Link
                      to={`/poll/${poll.id}`}
                      title="Open public poll"
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    >
                      <ExternalLink size={16} />
                    </Link>
                    <button
                      type="button"
                      title="Delete poll"
                      onClick={() => setDeleteTarget(poll)}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete this poll?"
          body="The poll, its options, and all votes will be permanently removed by cascading database deletes."
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
