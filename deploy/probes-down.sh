#!/usr/bin/env bash
# Destroy ALL probe responders (everything tagged proxima-probe). Idempotent —
# safe to run twice. This is your "stop the meter" button; run it after a demo.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env

list="$(api GET "/instances?tag=$PROBE_TAG&per_page=500")"
ids="$(printf '%s' "$list" | jq -r '.instances[].id')"
if [ -z "$ids" ]; then echo "No probe responders running. Nothing to do."; exit 0; fi

n="$(printf '%s\n' "$ids" | grep -c .)"
echo "Destroying $n probe responder(s)…" >&2
while read -r id; do
  [ -n "$id" ] || continue
  code="$(printf '%s' "$list" | jq -r --arg i "$id" '.instances[]|select(.id==$i)|.region')"
  api DELETE "/instances/$id" >/dev/null
  info "destroyed $code ($id)"
done <<<"$ids"
echo "All probe responders destroyed. Meter stopped." >&2
