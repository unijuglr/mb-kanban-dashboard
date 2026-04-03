-- MB-047: Agilitas .NET -> Node/Python migration SQL
-- Source: /Users/adamgoldband/agilitas-solutions/AgilitasTranscriptAnalyzer/SQL/*.sql
-- Target: Cloud SQL Postgres-compatible bootstrap for the current Agilitas stack.
-- Notes:
--   * Preserves the source MySQL/EF schema intent while fixing source-script issues
--     (quoted boolean identifiers and mysql-specific AUTO_INCREMENT syntax).
--   * Keeps transcript facts relational for reporting / joins.
--   * OLN/Neo4j remains optional for graph use-cases; see comments near the end.

BEGIN;

CREATE TABLE IF NOT EXISTS transcript_requests (
    id BIGSERIAL PRIMARY KEY,
    text TEXT,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    status INTEGER NOT NULL DEFAULT 0,
    insert_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_log (
    id BIGSERIAL PRIMARY KEY,
    transcript_request_id BIGINT REFERENCES transcript_requests(id) ON DELETE SET NULL,
    operation INTEGER NOT NULL,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    text TEXT,
    error_text TEXT,
    stack_trace TEXT,
    extra_info TEXT
);

CREATE TABLE IF NOT EXISTS emotions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_negative BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS transcript_request_emotions (
    id BIGSERIAL PRIMARY KEY,
    transcript_request_id BIGINT NOT NULL REFERENCES transcript_requests(id) ON DELETE CASCADE,
    emotion_id BIGINT NOT NULL REFERENCES emotions(id) ON DELETE RESTRICT,
    UNIQUE (transcript_request_id, emotion_id)
);

CREATE TABLE IF NOT EXISTS pain_point_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_predefined BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pain_point_issues (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL REFERENCES pain_point_categories(id) ON DELETE RESTRICT,
    is_predefined BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transcript_request_pain_points (
    id BIGSERIAL PRIMARY KEY,
    transcript_request_id BIGINT NOT NULL REFERENCES transcript_requests(id) ON DELETE CASCADE,
    issue_id BIGINT NOT NULL REFERENCES pain_point_issues(id) ON DELETE RESTRICT,
    UNIQUE (transcript_request_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_error_log_transcript_request_id
    ON error_log (transcript_request_id);
CREATE INDEX IF NOT EXISTS idx_tre_transcript_request_id
    ON transcript_request_emotions (transcript_request_id);
CREATE INDEX IF NOT EXISTS idx_trpp_transcript_request_id
    ON transcript_request_pain_points (transcript_request_id);
CREATE INDEX IF NOT EXISTS idx_pain_point_issues_category_id
    ON pain_point_issues (category_id);

INSERT INTO emotions (name, is_negative) VALUES
('Frustration', TRUE),
('Annoyance', TRUE),
('Impatience', TRUE),
('Irritation', TRUE),
('Exasperation', TRUE),
('Anger', TRUE),
('Outrage', TRUE),
('Hostility', TRUE),
('Fury', TRUE),
('Resentment', TRUE),
('Disappointment', TRUE),
('Sadness', TRUE),
('Disillusionment', TRUE),
('Discouragement', TRUE),
('Defeat', TRUE),
('Anxiety', TRUE),
('Worry', TRUE),
('Stress', TRUE),
('Fear', TRUE),
('Apprehension', TRUE),
('Nervousness', TRUE),
('Confusion', TRUE),
('Bewilderment', TRUE),
('Puzzlement', TRUE),
('Perplexity', TRUE),
('Sarcasm', TRUE),
('Contempt', TRUE),
('Mockery', TRUE),
('Scorn', TRUE),
('Disdain', TRUE),
('Satisfaction', FALSE),
('Pleasure', FALSE),
('Contentment', FALSE),
('Happiness', FALSE),
('Relief', FALSE),
('Gratitude', FALSE),
('Thankfulness', FALSE),
('Appreciation', FALSE),
('Excitement', FALSE),
('Enthusiasm', FALSE),
('Eagerness', FALSE),
('Anticipation', FALSE),
('Interest', FALSE),
('Curiosity', FALSE),
('Engagement', FALSE),
('Calmness', FALSE),
('Serenity', FALSE),
('Peace', FALSE),
('Tranquility', FALSE),
('Trust', FALSE),
('Confidence', FALSE),
('Security', FALSE),
('Assurance', FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO pain_point_categories (name, is_predefined) VALUES
('Process', TRUE),
('People', TRUE),
('Policy', TRUE),
('Product/Service', TRUE),
('Technology/System', TRUE),
('Communication', TRUE),
('Personalization/Empathy', TRUE),
('Resolution/Support Quality', TRUE),
('Reputation/Escalation Risk', TRUE)
ON CONFLICT (name) DO NOTHING;

WITH category_map AS (
    SELECT id, name FROM pain_point_categories
)
INSERT INTO pain_point_issues (name, category_id, is_predefined)
SELECT issue_name, category_id, TRUE
FROM (
    VALUES
        ('Long turnaround time', 'Process'),
        ('Repeated document requests', 'Process'),
        ('Process inconsistency', 'Process'),
        ('Lack of follow-up', 'Process'),
        ('Unclear next steps', 'Process'),
        ('Multiple transfers between teams', 'Process'),
        ('Rude or unempathetic agent', 'People'),
        ('No callback from representative', 'People'),
        ('Poor listening', 'People'),
        ('Repeated information requests', 'People'),
        ('Agent rejection (refusal to escalate)', 'People'),
        ('Unclear or confusing explanation', 'People'),
        ('Policy not explained clearly', 'Policy'),
        ('Unexpected requirement', 'Policy'),
        ('Policy inflexibility', 'Policy'),
        ('Denied escalation due to policy', 'Policy'),
        ('Customer disagrees with rule or limit', 'Policy'),
        ('Product limitations', 'Product/Service'),
        ('Account fee dissatisfaction', 'Product/Service'),
        ('Confusing product terms', 'Product/Service'),
        ('Misleading promotion', 'Product/Service'),
        ('Product not available', 'Product/Service'),
        ('Wrong account type opened', 'Product/Service'),
        ('Online portal not updating', 'Technology/System'),
        ('Error message or crash', 'Technology/System'),
        ('Upload failed', 'Technology/System'),
        ('Data not syncing', 'Technology/System'),
        ('Website downtime', 'Technology/System'),
        ('Mobile app issue', 'Technology/System'),
        ('Unclear communication', 'Communication'),
        ('Contradictory information', 'Communication'),
        ('Delayed email/SMS updates', 'Communication'),
        ('Miscommunication between teams', 'Communication'),
        ('Inconsistent documentation requests', 'Communication'),
        ('Generic responses', 'Personalization/Empathy'),
        ('Lack of ownership', 'Personalization/Empathy'),
        ('No proactive help', 'Personalization/Empathy'),
        ('Customer feels ignored or undervalued', 'Personalization/Empathy'),
        ('No emotional acknowledgment', 'Personalization/Empathy'),
        ('No resolution provided', 'Resolution/Support Quality'),
        ('Escalation not completed', 'Resolution/Support Quality'),
        ('Broken promise of callback', 'Resolution/Support Quality'),
        ('Lack of accountability', 'Resolution/Support Quality'),
        ('Case closed prematurely', 'Resolution/Support Quality'),
        ('Threat of legal action', 'Reputation/Escalation Risk'),
        ('Threat of social media post', 'Reputation/Escalation Risk'),
        ('Complaint about brand reputation', 'Reputation/Escalation Risk'),
        ('I''ll tell everyone not to use your product/company', 'Reputation/Escalation Risk')
) AS seed(issue_name, category_name)
JOIN category_map ON category_map.name = seed.category_name
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Optional graph projection notes (not executed here):
--   transcript_requests      -> :TranscriptRequest {id, file_name, status, insert_time}
--   pain_point_categories    -> :PainPointCategory {id, name, is_predefined}
--   pain_point_issues        -> :PainPointIssue {id, name, is_predefined}
--   emotions                 -> :Emotion {id, name, is_negative}
--   (:TranscriptRequest)-[:HAS_PAIN_POINT]->(:PainPointIssue)
--   (:PainPointIssue)-[:IN_CATEGORY]->(:PainPointCategory)
--   (:TranscriptRequest)-[:HAS_EMOTION]->(:Emotion)
