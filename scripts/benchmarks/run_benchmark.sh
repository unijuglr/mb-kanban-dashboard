#!/bin/bash

MODELS=("llama3.2:latest" "deepseek-coder-v2:16b" "qwen2.5-coder:14b")
PROMPTS_FILE="/tmp/prompts.json"
RESULTS_FILE="/tmp/benchmark-results.json"

echo "[" > $RESULTS_FILE
FIRST_ENTRY=true

for model in "${MODELS[@]}"; do
    echo "Benchmarking model: $model"
    # Extract IDs and prompts using jq if available, or just use python to extract them
    # Since Motherbrain has python3 but no requests, I'll use python3 to iterate and call curl
    
    python3 -c "import json; [print(f'{p[\"id\"]}|{p[\"category\"]}|{p[\"prompt\"]}') for p in json.load(open('$PROMPTS_FILE'))]" | while IFS='|' read -r id category prompt; do
        echo "  - Prompt: $id ($category)"
        
        # Call Ollama API using curl
        RESPONSE=$(curl -s -X POST http://127.0.0.1:11434/api/generate -d "{\"model\": \"$model\", \"prompt\": \"$prompt\", \"stream\": false}")
        
        # Process response with python
        PROCESSED=$(echo "$RESPONSE" | python3 -c "
import sys, json, time
try:
    data = json.load(sys.stdin)
    eval_count = data.get('eval_count', 0)
    eval_duration = data.get('eval_duration', 0) / 1e9
    tokens_per_sec = eval_count / eval_duration if eval_duration > 0 else 0
    print(json.dumps({
        'success': True,
        'model': '$model',
        'prompt_id': '$id',
        'category': '$category',
        'tokens_per_sec': tokens_per_sec,
        'eval_count': eval_count,
        'total_time': eval_duration,
        'response_preview': data.get('response', '')[:100]
    }))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
")
        
        if [ "$FIRST_ENTRY" = true ]; then
            echo "$PROCESSED" >> $RESULTS_FILE
            FIRST_ENTRY=false
        else
            echo ",$PROCESSED" >> $RESULTS_FILE
        fi
    done
done

echo "]" >> $RESULTS_FILE
echo "Results saved to $RESULTS_FILE"
