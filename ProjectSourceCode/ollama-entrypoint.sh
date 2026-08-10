#!/bin/bash
# Entrypoint for the self-hosted Ollama service.
# Starts the server, waits until it is ready, then ensures the chat model is
# pulled so the /stream proxy has a model to talk to on first boot.
set -e

MODEL_NAME="${OLLAMA_MODEL:-gemma:2b}"

echo "[entrypoint] Starting Ollama server..."
ollama serve &
SERVER_PID=$!

echo "[entrypoint] Waiting for Ollama to accept connections..."
until ollama list >/dev/null 2>&1; do
  sleep 1
done

if ollama list | grep -q "${MODEL_NAME%%:*}"; then
  echo "[entrypoint] Model '$MODEL_NAME' already present."
else
  echo "[entrypoint] Pulling model '$MODEL_NAME' (first run only)..."
  ollama pull "$MODEL_NAME"
fi

echo "[entrypoint] Ollama ready with model '$MODEL_NAME'."
wait "$SERVER_PID"
