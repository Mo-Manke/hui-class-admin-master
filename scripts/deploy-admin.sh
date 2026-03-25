#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/www/wwwroot/hui-class-admin}"
REPO_DIR="${REPO_DIR:-$APP_ROOT/repo}"
SITE_DIR="${SITE_DIR:-$APP_ROOT/www}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "repo not found: $REPO_DIR"
  exit 1
fi

mkdir -p "$SITE_DIR" "$APP_ROOT/scripts"

cd "$REPO_DIR"
git fetch --all --prune
git reset --hard "origin/$DEPLOY_BRANCH"

npm ci
npm run build:prod

if [ ! -d "dist" ]; then
  echo "dist directory not found"
  exit 1
fi

find "$SITE_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -R dist/. "$SITE_DIR/"
