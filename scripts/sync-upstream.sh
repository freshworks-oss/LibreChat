#!/usr/bin/env bash
#
# Sync this fork with upstream danny-avila/LibreChat:
#   1. Fast-forward local main to upstream/main, push to origin/main.
#   2. Merge main into dev, push to origin/dev.
#
# If the merge conflicts, resolve the conflicts, `git add` the files,
# `git commit`, then rerun this script to push.
#
set -euo pipefail

UPSTREAM_URL="https://github.com/danny-avila/LibreChat.git"
MAIN_BRANCH="main"
DEV_BRANCH="dev"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

if ! git remote get-url upstream >/dev/null 2>&1; then
  git remote add upstream "$UPSTREAM_URL"
fi

git fetch upstream "$MAIN_BRANCH"

git checkout "$MAIN_BRANCH"
git merge --ff-only "upstream/$MAIN_BRANCH"
git push origin "$MAIN_BRANCH"

git checkout "$DEV_BRANCH"
git merge "$MAIN_BRANCH" --no-edit
git push origin "$DEV_BRANCH"
