#!/bin/sh
# Caches the configuration, routes, events and views from the environment the
# container was started with, then runs the command (Apache by default).
#
# Not `artisan optimize`: it also has laravel-data cache its structures in the
# cache store, which is a database table that does not exist before the first
# migration.
set -e

for cache in config route event view; do
    php artisan "$cache:cache" --no-interaction > /dev/null
done
chown -R www-data:www-data storage bootstrap/cache

exec docker-php-entrypoint "$@"
