FROM ollama/ollama:latest

RUN apt-get update && apt-get install -y curl

COPY ollama-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
