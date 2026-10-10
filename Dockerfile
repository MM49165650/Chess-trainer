# Development and CI image: PHP with Node alongside it, because the Vite
# plugins call `php artisan` and the check command runs both toolchains.

FROM node:24-bookworm-slim AS node

FROM composer:2 AS composer

FROM ghcr.io/gitleaks/gitleaks:v8.30.1 AS gitleaks

FROM php:8.4-cli-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libpq-dev libzip-dev libicu-dev \
    && docker-php-ext-install pdo_pgsql pcntl zip intl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer /usr/bin/composer /usr/local/bin/composer

COPY --from=gitleaks /usr/bin/gitleaks /usr/local/bin/gitleaks

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# The project folder is mounted from the host and owned by another user.
RUN git config --system --add safe.directory /app

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

EXPOSE 8000 5173
