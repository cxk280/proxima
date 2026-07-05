#!/usr/bin/env bash
# Shared helpers for the Proxima Vultr deploy scripts.
# Sourced by verify.sh / probes-up.sh / probes-down.sh / app-deploy.sh.
set -euo pipefail

API="https://api.vultr.com/v2"
PROBE_TAG="proxima-probe"   # instances the probe scripts create/destroy
APP_TAG="proxima-app"       # the always-on app host

here() { cd "$(dirname "${BASH_SOURCE[0]}")" && pwd; }
DEPLOY_DIR="$(here)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"

die() { echo "error: $*" >&2; exit 1; }
info() { echo "  $*" >&2; }

load_env() {
  [ -f "$DEPLOY_DIR/.env" ] || die "no deploy/.env — copy deploy/.env.example to deploy/.env and add your VULTR_API_KEY"
  set -a; . "$DEPLOY_DIR/.env"; set +a
  [ -n "${VULTR_API_KEY:-}" ] || die "VULTR_API_KEY is empty in deploy/.env"
}

# api METHOD PATH [json-body] -> response body on stdout; nonzero + message on HTTP >=400
api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS -X "$method" -H "Authorization: Bearer $VULTR_API_KEY" -w '\n%{http_code}')
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  local out code
  out="$(curl "${args[@]}" "$API$path")" || die "curl failed for $method $path"
  code="$(printf '%s' "$out" | tail -n1)"
  body="$(printf '%s' "$out" | sed '$d')"
  if [ "$code" -ge 400 ]; then
    echo "$body" >&2
    die "Vultr API $method $path returned HTTP $code"
  fi
  printf '%s' "$body"
}

# The mesh region ids the app understands (keys for PROXIMA_REGION_ENDPOINTS).
mesh_region_ids() {
  grep -oE 'id:[[:space:]]*"[a-z0-9-]+"' "$REPO_DIR/lib/mesh/regions.ts" \
    | sed -E 's/.*"([a-z0-9-]+)".*/\1/'
}

default_pubkey() {
  echo "${PROXIMA_SSH_PUBKEY:-$HOME/.ssh/id_ed25519.pub}"
}
