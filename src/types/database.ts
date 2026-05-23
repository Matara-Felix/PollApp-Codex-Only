export type Poll = {
  id: string;
  question: string;
  created_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  text: string;
  position: number;
  created_at: string;
};

export type Vote = {
  id: string;
  poll_id: string;
  option_id: string;
  voter_session: string | null;
  created_at: string;
};

export type PollWithOptions = Poll & {
  options: PollOption[];
};

export type OptionResult = PollOption & {
  votes: number;
  percentage: number;
};

export type PollResults = {
  totalVotes: number;
  options: OptionResult[];
};
