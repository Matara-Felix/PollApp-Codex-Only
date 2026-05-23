import { FormEvent, useMemo, useState } from 'react';
import { Clipboard, Minus, Plus, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPoll } from '../lib/polls';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [createdLink, setCreatedLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cleanedOptions = useMemo(() => options.map((option) => option.trim()).filter(Boolean), [options]);
  const canSubmit = question.trim().length >= 5 && cleanedOptions.length >= MIN_OPTIONS;

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  }

  function addOption() {
    if (options.length < MAX_OPTIONS) setOptions((current) => [...current, '']);
  }

  function removeOption(index: number) {
    if (options.length > MIN_OPTIONS) {
      setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      toast.error('Add a question and at least two options.');
      return;
    }

    const uniqueOptions = new Set(cleanedOptions.map((option) => option.toLowerCase()));
    if (uniqueOptions.size !== cleanedOptions.length) {
      toast.error('Options must be unique.');
      return;
    }

    setSubmitting(true);
    try {
      const poll = await createPoll(question, cleanedOptions);
      const link = `${window.location.origin}/poll/${poll.id}`;
      setCreatedLink(link);
      toast.success('Poll created');
      navigate(`/poll/${poll.id}`, { state: { createdLink: link } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create poll.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(createdLink);
    toast.success('Link copied');
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Live polling</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Create a poll people can vote on instantly.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Build a public poll, share the voting link, and watch the results update in real time as votes arrive.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 rounded-xl bg-white p-5 shadow-soft sm:p-6">
          <label className="block text-sm font-semibold text-slate-800" htmlFor="question">
            Poll question
          </label>
          <input
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={240}
            placeholder="Which roadmap item should we prioritize?"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <div className="mt-6 flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-slate-800">Options</label>
            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= MAX_OPTIONS}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={option}
                  maxLength={160}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  title="Remove option"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= MIN_OPTIONS}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? 'Creating...' : 'Create poll'}
          </button>
        </form>
      </section>

      <aside className="rounded-xl bg-slate-950 p-6 text-white shadow-soft">
        <h2 className="text-xl font-semibold">Shareable voting link</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          After the poll is created, voters land on a public page. The browser stores a local vote marker so each session votes once.
        </p>
        <div className="mt-6 rounded-lg bg-white/10 p-4">
          <p className="break-all text-sm text-slate-200">{createdLink || 'Your link appears after creation.'}</p>
        </div>
        <button
          type="button"
          onClick={copyLink}
          disabled={!createdLink}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Clipboard size={17} />
          Copy link
        </button>
      </aside>
    </div>
  );
}
