#!/usr/bin/env bash
# Deploys the latest main branch: pulls it, builds the new image while the
# old container keeps serving, backs up the database, runs the migrations and
# swaps the container. The site is down only for the swap, a few seconds.
#
# Run as root on the server:  bash /opt/chess-trainer/deploy/deploy.sh
# See docs/deployment.md.

set -euo pipefail

# Everything is inside a function, so that bash has read the whole script
# before `git pull` replaces it.
main() {
    cd "$(dirname "$0")/.."

    # backup.sh needs it; checked here so that nothing changes without it.
    if [ -z "${HESTIA_USER:-}" ]; then
        echo "HESTIA_USER is not set. See section 0 of docs/deployment.md." >&2
        exit 1
    fi

    if [ "$(git rev-parse --abbrev-ref HEAD)" != main ]; then
        echo "The checkout is not on main. Run: git switch main" >&2
        exit 1
    fi

    if [ ! -f .env ]; then
        echo "There is no .env here. See docs/deployment.md." >&2
        exit 1
    fi

    echo "==> Pulling main"
    git pull --ff-only origin main
    git log -1 --format='    %h %s'

    echo "==> Building the image (the site stays up)"
    # The image running now is kept as :previous, for a quick rollback.
    if docker image inspect chess-trainer-app:latest > /dev/null 2>&1; then
        docker tag chess-trainer-app:latest chess-trainer-app:previous
    fi
    compose build --pull app

    if [ -n "$(compose ps --status running --quiet postgres)" ]; then
        echo "==> Backing up the database"
        bash deploy/backup.sh
    fi

    echo "==> Starting Postgres"
    compose up -d --wait postgres

    echo "==> Running the migrations"
    compose run --rm --no-deps app php artisan migrate --force

    echo "==> Swapping the app container"
    compose up -d --no-deps --wait app

    echo "==> Removing unused images"
    docker image prune -f > /dev/null

    curl -fsS -o /dev/null http://127.0.0.1:8012/up
    echo "==> Deployed $(git log -1 --format=%h). The app answers on 127.0.0.1:8012."
}

compose() {
    docker compose -f compose.production.yaml "$@"
}

main "$@"
exit
