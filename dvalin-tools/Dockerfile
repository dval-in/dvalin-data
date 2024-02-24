# Build Stage
FROM python:3.11-alpine as builder
LABEL authors="Samuel Giffard <samuel@giffard.co>"

# Install build dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    && python -m pip install --upgrade pip

# Install Poetry
ENV POETRY_VERSION=1.7.1
RUN pip install "poetry==$POETRY_VERSION"

# Set the working directory
WORKDIR /usr/src/app

# Copy project files
COPY poetry.lock pyproject.toml ./

# Install dependencies using Poetry in a way that they can be copied later
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy the rest of the application code
COPY . .

# Runtime Stage (local development)
FROM python:3.11-alpine as runtime-localdev
LABEL authors="Samuel Giffard <samuel@giffard.co>"

# Create a non-root user
RUN adduser -D celeryuser
USER celeryuser

# Set the working directory
WORKDIR /usr/src/app

# Copy installed packages from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code from the builder stage
COPY --from=builder --chown=celeryuser:celeryuser /usr/src/app/dvalin_tools ./dvalin_tools

# Runtime Stage (production)
FROM runtime-localdev as runtime-prod

ARG DVALIN_REPO_ROOT_DIR=${DVALIN_REPO_ROOT_DIR:-/usr/src/repo/dvalin-data}

USER root
# Install build dependencies
RUN apk fix && \
    apk --no-cache --update add git git-lfs gpg less openssh patch && \
    git lfs install

USER celeryuser

WORKDIR ${DVALIN_REPO_ROOT_DIR}

RUN git clone https://github.com/dval-in/dvalin-data.git ${DVALIN_REPO_ROOT_DIR}

WORKDIR /usr/src/app

COPY --chown=celeryuser:celeryuser __scraper_cache__ /usr/src/__scraper_cache__
