-- ─────────────────────────────────────────────
-- SRM Project Tracker — initial schema
-- Paste this into Vercel Postgres → Query tab
-- ─────────────────────────────────────────────

create table if not exists workstreams (
  id          text primary key,
  label       text not null,
  color       text not null,
  sort_order  integer default 0
);

create table if not exists tasks (
  id                text primary key,
  ws                text references workstreams(id),
  name              text not null,
  notes             text,
  due               date,
  owner             text,
  status            text default 'not-started',
  type              text default 'task',
  duration          integer default 1,
  priority          boolean default false,
  is_review         boolean default false,
  is_subtask        boolean default false,
  parent_id         text references tasks(id),
  send_date         date,
  review_days       integer,
  review_end_date   date,
  exceeds_deadline  boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute procedure set_updated_at();

create table if not exists pto (
  id          text primary key,
  person      text not null,
  from_date   date not null,
  to_date     date not null
);

create index if not exists tasks_ws_idx     on tasks(ws);
create index if not exists tasks_due_idx    on tasks(due);
create index if not exists tasks_parent_idx on tasks(parent_id);
create index if not exists tasks_status_idx on tasks(status);
