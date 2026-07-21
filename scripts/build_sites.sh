#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdocs_bin="$project_root/.venv/bin/mkdocs"

if [[ ! -x "$mkdocs_bin" ]]; then
  mkdocs_bin="mkdocs"
fi

"$mkdocs_bin" build --strict --site-dir "$project_root/dist/client"
mkdir -p "$project_root/dist/server"
cp "$project_root/sites/worker.mjs" "$project_root/dist/server/index.js"
