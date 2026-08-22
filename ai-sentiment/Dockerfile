# Build dependencies
FROM python:3.13-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Production runner
FROM python:3.13-slim AS runner
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH=/root/.local/bin:$PATH

RUN useradd -m -u 1001 citisent && \
    mkdir -p /app && chown -R citisent:citisent /app

COPY --from=builder /root/.local /home/citisent/.local
COPY . /app
RUN chown -R citisent:citisent /app

USER citisent
ENV PATH=/home/citisent/.local/bin:$PATH

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/status')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
