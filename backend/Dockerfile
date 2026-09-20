# Dockerfile for Python Backend Microservice
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

EXPOSE 8000

ENV PORT=8000
ENV HOST=0.0.0.0
ENV DATABASE_PATH=quantum_traffic.db

CMD ["python", "backend/bridge.py", "health", "{}"]
