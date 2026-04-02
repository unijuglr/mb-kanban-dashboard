#!/bin/bash

# Configuration
BASE_VOLUME="/Volumes/hellastuff 1/oln"
LOG_VOLUME="/Volumes/external-logs/oln"

echo "Initializing directories on Motherbrain..."

# Create core directories
mkdir -p "$BASE_VOLUME/neo4j/data"
mkdir -p "$BASE_VOLUME/neo4j/logs"
mkdir -p "$BASE_VOLUME/temporal/data"
mkdir -p "$BASE_VOLUME/temporal/logs"
mkdir -p "$BASE_VOLUME/temporal/postgres-data"
mkdir -p "$BASE_VOLUME/redis/data"

mkdir -p "$LOG_VOLUME"

# Permissions
echo "Setting permissions..."
chmod -R 777 "$BASE_VOLUME"
chmod -R 777 "$LOG_VOLUME"

echo "Initialization complete."
