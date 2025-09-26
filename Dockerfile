# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose the port (dynamic from env)
EXPOSE ${PORT:-5000}

# Start the app with gunicorn
# Uses environment variable $PORT if set, otherwise defaults to 5000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 300 app:app"]
