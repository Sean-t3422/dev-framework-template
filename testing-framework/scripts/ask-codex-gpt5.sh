#!/bin/bash

# ask-codex-gpt5.sh - Call Codex CLI with GPT-5 models
# Updated to use correct model identifiers

PROMPT="$1"
TASK_TYPE="${2:-code-analysis}"  # Default to code analysis
TIMEOUT="${3:-180}"

if [ -z "$PROMPT" ]; then
    echo "Usage: $0 <prompt> [task-type] [timeout]"
    echo "Task types: code-analysis, general"
    exit 1
fi

# Select appropriate GPT-5 model based on task
case "$TASK_TYPE" in
    "code-analysis"|"code-review"|"security")
        MODEL="gpt-5-codex"
        echo "Using GPT-5 Codex for code analysis..." >&2
        ;;
    "general"|"architecture"|"ux"|"documentation")
        MODEL="gpt-5"
        echo "Using GPT-5 for general analysis..." >&2
        ;;
    *)
        # Default to gpt-5-codex
        MODEL="gpt-5-codex"
        echo "Using default GPT-5 Codex..." >&2
        ;;
esac

# Create temporary file for response
RESPONSE_FILE=$(mktemp)

# Execute with timeout and capture response
(
    timeout "$TIMEOUT" bash -c "echo '$PROMPT' | codex exec -m $MODEL --full-auto 2>/dev/null"
) > "$RESPONSE_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
    echo "ERROR: Codex timeout after ${TIMEOUT} seconds" >&2
    rm "$RESPONSE_FILE"
    exit 124
elif [ $EXIT_CODE -ne 0 ]; then
    echo "ERROR: Codex failed with exit code $EXIT_CODE" >&2
    cat "$RESPONSE_FILE" >&2
    rm "$RESPONSE_FILE"
    exit $EXIT_CODE
fi

# Output the response
cat "$RESPONSE_FILE"

# Clean up
rm "$RESPONSE_FILE"