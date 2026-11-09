FROM python:3.12-alpine
WORKDIR /app
COPY timer.py /app/timer.py
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 65532:65532
CMD ["python", "/app/timer.py"]
