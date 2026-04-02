// Initial Neo4j constraints and indexes for Star Wars Lore Network (OLN)
// Run this after starting Neo4j on Motherbrain

// Unique identifier for every lore entity
CREATE CONSTRAINT entity_olid IF NOT EXISTS FOR (e:Entity) REQUIRE e.olid IS UNIQUE;

// Performance indexes for search
CREATE INDEX entity_title_index IF NOT EXISTS FOR (e:Entity) ON (e.title);
CREATE INDEX entity_type_index IF NOT EXISTS FOR (e:Entity) ON (e.type);

// Relationship performance (if supported by Neo4j version)
// CREATE INDEX rel_type_index IF NOT EXISTS FOR ()-[r:MENTIONS]-() ON (r.type);
