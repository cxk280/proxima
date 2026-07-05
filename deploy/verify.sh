#!/usr/bin/env bash
# Read-only sanity check: confirms the API key works and prints account +
# region/plan context. Creates NOTHING and costs NOTHING. Run this first.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env

echo "Checking Vultr API key (read-only)…" >&2

acct="$(api GET /account)"
name="$(printf '%s' "$acct" | jq -r '.account.name // "?"')"
bal="$(printf '%s' "$acct" | jq -r '.account.balance // "?"')"
pending="$(printf '%s' "$acct" | jq -r '.account.pending_charges // "?"')"

regions="$(api GET /regions)"
nreg="$(printf '%s' "$regions" | jq '.regions | length')"

echo
echo "✓ Key works."
echo "  Account:          $name"
echo "  Balance:          \$$bal   (pending charges: \$$pending)"
echo "  Vultr regions:    $nreg available"

# How many of our mesh regions have a matching Vultr region (candidates for
# real-RTT probes). Overlap = the codes we can actually stand a responder in.
vultr_ids="$(printf '%s' "$regions" | jq -r '.regions[].id')"
overlap=0; misses=""
while read -r m; do
  if grep -qx "$m" <<<"$vultr_ids"; then overlap=$((overlap+1)); else misses="$misses $m"; fi
done < <(mesh_region_ids)
echo "  Mesh∩Vultr:       $overlap of 33 mesh regions map to a Vultr region"
[ -n "$misses" ] && echo "  (no Vultr region for:$misses — these stay modeled)"
echo
echo "Nothing was created. Next: pick a few regions and run ./probes-up.sh"
