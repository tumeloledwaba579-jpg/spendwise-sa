FROM python:3.13-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run database migrations and then start the app on Render's PORT
# This command will be run when the container starts
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}