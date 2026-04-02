-- MB-047 Agilitas .NET migration track
-- Prepared: 2026-04-02
-- Purpose: durable, repo-local Cloud SQL migration artifact derived from the legacy
-- AgilitasTranscriptAnalyzer SQL scripts plus EF model mappings.
--
-- Legacy source files inspected:
--   /Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/1 Db initial script.sql
--   /Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/2 Add emotions.sql
--   /Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/3 Add Pain Points.sql
--   /Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/Agilitas.Data/Database/Mappings/*.cs
--
-- Notes:
-- - The legacy scripts are MySQL-oriented and contain quoting defects around IsPredefined.
-- - This file normalizes the schema for PostgreSQL / Cloud SQL while preserving the same
--   business entities and seed values.
-- - Neo4j/graph adaptation is documented separately in docs/agilitas/dotnet-to-gcp-feature-map.md.

begin;

create table if not exists transcript_requests (
  id integer generated always as identity primary key,
  text text,
  file_name varchar(255) not null,
  status integer not null default 1,
  insert_time timestamptz not null default now(),
  constraint ck_transcript_requests_status
    check (status in (1, 2, 3))
);

comment on table transcript_requests is 'Legacy TranscriptRequests table from Agilitas .NET. Status enum: 1 Added, 2 Processed, 3 Failed.';

create table if not exists error_log (
  id integer generated always as identity primary key,
  transcript_request_id integer references transcript_requests(id) on delete set null,
  operation integer not null,
  creation_time timestamptz not null default now(),
  text text,
  error_text text,
  stack_trace text,
  extra_info text,
  constraint ck_error_log_operation
    check (operation between 1 and 7)
);

comment on table error_log is 'Legacy ErrorLog table. Operation enum: 1 ReadingFromStorage, 2 WritingToDatabase, 3 Parsing, 4 PainPointAnalysis, 5 EmotionsAnalysis, 6 ExtraInfoAnalysis, 7 SavingResult.';

create index if not exists idx_error_log_transcript_request_id
  on error_log (transcript_request_id);

create table if not exists emotions (
  id integer generated always as identity primary key,
  name varchar(100) not null unique,
  is_negative boolean not null
);

create table if not exists transcript_request_emotions (
  id integer generated always as identity primary key,
  transcript_request_id integer not null references transcript_requests(id) on delete cascade,
  emotion_id integer not null references emotions(id) on delete cascade,
  unique (transcript_request_id, emotion_id)
);

create table if not exists pain_point_categories (
  id integer generated always as identity primary key,
  name varchar(100) not null unique,
  is_predefined boolean not null
);

create table if not exists pain_point_issues (
  id integer generated always as identity primary key,
  name varchar(200) not null unique,
  category_id integer not null references pain_point_categories(id) on delete restrict,
  is_predefined boolean not null
);

create table if not exists transcript_request_pain_points (
  id integer generated always as identity primary key,
  transcript_request_id integer not null references transcript_requests(id) on delete cascade,
  issue_id integer not null references pain_point_issues(id) on delete cascade,
  unique (transcript_request_id, issue_id)
);

insert into emotions (name, is_negative) values
  ('Frustration', true),
  ('Annoyance', true),
  ('Impatience', true),
  ('Irritation', true),
  ('Exasperation', true),
  ('Anger', true),
  ('Outrage', true),
  ('Hostility', true),
  ('Fury', true),
  ('Resentment', true),
  ('Disappointment', true),
  ('Sadness', true),
  ('Disillusionment', true),
  ('Discouragement', true),
  ('Defeat', true),
  ('Anxiety', true),
  ('Worry', true),
  ('Stress', true),
  ('Fear', true),
  ('Apprehension', true),
  ('Nervousness', true),
  ('Confusion', true),
  ('Bewilderment', true),
  ('Puzzlement', true),
  ('Perplexity', true),
  ('Sarcasm', true),
  ('Contempt', true),
  ('Mockery', true),
  ('Scorn', true),
  ('Disdain', true),
  ('Satisfaction', false),
  ('Pleasure', false),
  ('Contentment', false),
  ('Happiness', false),
  ('Relief', false),
  ('Gratitude', false),
  ('Thankfulness', false),
  ('Appreciation', false),
  ('Excitement', false),
  ('Enthusiasm', false),
  ('Eagerness', false),
  ('Anticipation', false),
  ('Interest', false),
  ('Curiosity', false),
  ('Engagement', false),
  ('Calmness', false),
  ('Serenity', false),
  ('Peace', false),
  ('Tranquility', false),
  ('Trust', false),
  ('Confidence', false),
  ('Security', false),
  ('Assurance', false)
on conflict (name) do nothing;

insert into pain_point_categories (name, is_predefined) values
  ('Process', true),
  ('People', true),
  ('Policy', true),
  ('Product/Service', true),
  ('Technology/System', true),
  ('Communication', true),
  ('Personalization/Empathy', true),
  ('Resolution/Support Quality', true),
  ('Reputation/Escalation Risk', true)
on conflict (name) do nothing;

insert into pain_point_issues (name, category_id, is_predefined)
select v.name, c.id, v.is_predefined
from (values
  ('Long turnaround time', 'Process', true),
  ('Repeated document requests', 'Process', true),
  ('Process inconsistency', 'Process', true),
  ('Lack of follow-up', 'Process', true),
  ('Unclear next steps', 'Process', true),
  ('Multiple transfers between teams', 'Process', true),
  ('Rude or unempathetic agent', 'People', true),
  ('No callback from representative', 'People', true),
  ('Poor listening', 'People', true),
  ('Repeated information requests', 'People', true),
  ('Agent rejection (refusal to escalate)', 'People', true),
  ('Unclear or confusing explanation', 'People', true),
  ('Policy not explained clearly', 'Policy', true),
  ('Unexpected requirement', 'Policy', true),
  ('Policy inflexibility', 'Policy', true),
  ('Denied escalation due to policy', 'Policy', true),
  ('Customer disagrees with rule or limit', 'Policy', true),
  ('Product limitations', 'Product/Service', true),
  ('Account fee dissatisfaction', 'Product/Service', true),
  ('Confusing product terms', 'Product/Service', true),
  ('Misleading promotion', 'Product/Service', true),
  ('Product not available', 'Product/Service', true),
  ('Wrong account type opened', 'Product/Service', true),
  ('Online portal not updating', 'Technology/System', true),
  ('Error message or crash', 'Technology/System', true),
  ('Upload failed', 'Technology/System', true),
  ('Data not syncing', 'Technology/System', true),
  ('Website downtime', 'Technology/System', true),
  ('Mobile app issue', 'Technology/System', true),
  ('Unclear communication', 'Communication', true),
  ('Contradictory information', 'Communication', true),
  ('Delayed email/SMS updates', 'Communication', true),
  ('Miscommunication between teams', 'Communication', true),
  ('Inconsistent documentation requests', 'Communication', true),
  ('Generic responses', 'Personalization/Empathy', true),
  ('Lack of ownership', 'Personalization/Empathy', true),
  ('No proactive help', 'Personalization/Empathy', true),
  ('Customer feels ignored or undervalued', 'Personalization/Empathy', true),
  ('No emotional acknowledgment', 'Personalization/Empathy', true),
  ('No resolution provided', 'Resolution/Support Quality', true),
  ('Escalation not completed', 'Resolution/Support Quality', true),
  ('Broken promise of callback', 'Resolution/Support Quality', true),
  ('Lack of accountability', 'Resolution/Support Quality', true),
  ('Case closed prematurely', 'Resolution/Support Quality', true),
  ('Threat of legal action', 'Reputation/Escalation Risk', true),
  ('Threat of social media post', 'Reputation/Escalation Risk', true),
  ('Complaint about brand reputation', 'Reputation/Escalation Risk', true),
  ('“I’ll tell everyone not to use your product/company”', 'Reputation/Escalation Risk', true)
) as v(name, category_name, is_predefined)
join pain_point_categories c on c.name = v.category_name
on conflict (name) do nothing;

commit;

-- Expected seed counts after first successful run:
--   emotions: 53
--   pain_point_categories: 9
--   pain_point_issues: 48
--
-- Recommended follow-on mapping into the new architecture:
--   Cloud SQL: transcript_requests, error_log, reference tables, join tables
--   Neo4j: transcript -> emotion / pain-point relationships for graph traversal
