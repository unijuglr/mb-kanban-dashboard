#!/bin/bash

# Configuration
DEFAULT_BASE_VOLUME="/Volumes/hellastuff/oln"
ALT_BASE_VOLUME="/Volumes/hellastuff 1/oln"
BASE_VOLUME="${OLN_BASE_VOLUME:-}"
LOG_VOLUME="${OLN_LOG_VOLUME:-/Volumes/external-logs/oln}"

if [ -z "$BASE_VOLUME" ]; then
  if [ -d "/Volumes/hellastuff" ]; then
    BASE_VOLUME="$DEFAULT_BASE_VOLUME"
  elif [ -d "/Volumes/hellastuff 1" ]; then
    BASE_VOLUME="$ALT_BASE_VOLUME"
  else
    BASE_VOLUME="$DEFAULT_BASE_VOLUME"
  fi
fi

echo "Initializing OLN directories on Motherbrain..."
echo "Using OLN_BASE_VOLUME=$BASE_VOLUME"
echo "Using OLN_LOG_VOLUME=$LOG_VOLUME"

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
