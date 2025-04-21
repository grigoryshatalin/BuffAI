#!/bin/bash

MODEL_NAME="gemma3:1b"

echo "[entrypoint] Starting Ollama server..."
ollama serve & 

until curl -s http://localhost:11434/api/tags > /dev/null; do
  echo "⏳ Waiting for Ollama to be ready..."
  sleep 1
done

if ! curl -s http://localhost:11434/api/tags | grep -q "$MODEL_NAME"; then
  echo "Pulling model: $MODEL_NAME"
  curl -s http://localhost:11434/api/pull -d "{\"name\": \"$MODEL_NAME\"}"
else
  echo "Model '$MODEL_NAME' already pulled."
fi

wait