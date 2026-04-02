#!/bin/bash

# Configuration
# Note: Using /Volumes/hellastuff as the primary mount point per current implementation
# If you need to switch to "/Volumes/hellastuff 1", update this variable.
BASE_VOLUME="/Volumes/hellastuff/oln"
LOG_VOLUME="/Volumes/external-logs/oln"

echo "Initializing OLN directories on Motherbrain..."

# Create core directories
mkdir -p "$BASE_VOLUME/neo4j/data"
mkdir -p "$BASE_VOLUME/neo4j/logs"
mkdir -p "$BASE_VOLUME/neo4j/import"
mkdir -p "$BASE_VOLUME/neo4j/plugins"
mkdir -p "$BASE_VOLUME/temporal/data"
mkdir -p "$BASE_VOLUME/temporal/postgres-data"

mkdir -p "$LOG_VOLUME"

# Permissions
echo "Setting permissions..."
# Using 777 for initial setup to ensure containers can write, but should be narrowed later
chmod -R 777 "$BASE_VOLUME" 2>/dev/null || echo "Warning: Could not set permissions on $BASE_VOLUME"
chmod -R 777 "$LOG_VOLUME" 2>/dev/null || echo "Warning: Could not set permissions on $LOG_VOLUME"

echo "Initialization complete."
