#!/usr/bin/env bash
# Stand up real-RTT probe responders (HTTPS, browser-measurable) in one or more
# Vultr regions.
#   ./probes-up.sh ewr sjc lhr nrt syd bom
# Picks the cheapest >=1GB plan available in each region, boots a Caddy responder
# (auto-TLS on <ip>.sslip.io, `respond 200` + CORS) via cloud-init, waits for IPs,
# and prints a ready-to-paste PROXIMA_REGION_ENDPOINTS JSON. BILLABLE (~$5/mo =
# ~$0.007/hr each) — run ./probes-down.sh to destroy them all after the demo.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env

[ "$#" -ge 1 ] || die "usage: ./probes-up.sh <region> [region...]   e.g. ./probes-up.sh fra nrt gru syd"

echo "Resolving Vultr catalog..." >&2
regions_json="$(api GET /regions)"
plans_json="$(api GET /plans?type=vc2)"
os_json="$(api GET /os?per_page=500)"
os_id="$(printf '%s' "$os_json" | jq -r '.os[] | select(.name|test("Ubuntu 24.04.*x64")) | .id' | head -1)"
[ -n "$os_id" ] && [ "$os_id" != "null" ] || die "could not find Ubuntu 24.04 x64 OS id"

valid_vultr="$(printf '%s' "$regions_json" | jq -r '.regions[].id')"
valid_mesh="$(mesh_region_ids)"

# Responders serve HTTPS via Caddy (auto-TLS on a <ip>.sslip.io hostname) so a
# BROWSER can measure them without tripping the mixed-content rule. Each box just
# `respond 200` with CORS open — no GPU, no app. It self-configures from its own
# public IP via the Vultr metadata service, so this script stays API-only (no SSH
# in the hot path); an SSH key is still injected for manual fixups.
PUBKEY_FILE="$(default_pubkey)"
[ -f "$PUBKEY_FILE" ] || die "no SSH pubkey at $PUBKEY_FILE (set PROXIMA_SSH_PUBKEY in deploy/.env)"
PUBKEY="$(cat "$PUBKEY_FILE")"
cloud_init="$(cat <<EOF
#cloud-config
ssh_authorized_keys:
  - $PUBKEY
package_update: true
runcmd:
  - apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  - curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  - curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | tee /etc/apt/sources.list.d/caddy-stable.list
  - apt-get update && apt-get install -y caddy
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - bash -c 'IP=\$(curl -s --max-time 5 http://169.254.169.254/v1/interfaces/0/ipv4/address); [ -n "\$IP" ] || IP=\$(hostname -I | awk "{print \\\$1}"); HOST=\$(echo \$IP | tr . -).sslip.io; printf "%s {\n  header Access-Control-Allow-Origin *\n  header Timing-Allow-Origin *\n  header Cache-Control no-store\n  respond 200\n}\n" "\$HOST" > /etc/caddy/Caddyfile; systemctl enable caddy; systemctl restart caddy'
EOF
)"
user_data="$(printf '%s' "$cloud_init" | base64 | tr -d '\n')"

# Parallel indexed arrays (ids[i] <-> regions[i] <-> ips[i]) — portable to the
# bash 3.2 that ships on macOS, which has no associative arrays.
ids=(); regions=()
for code in "$@"; do
  grep -qx "$code" <<<"$valid_vultr" || { info "skip $code — not a Vultr region"; continue; }
  grep -qx "$code" <<<"$valid_mesh"  || info "note: $code is a Vultr region but not a mesh id — endpoint won't bind to a mesh region"
  # cheapest vc2 plan in this region with >=1GB RAM (Ubuntu 24.04's minimum)
  plan="$(printf '%s' "$plans_json" \
    | jq -r --arg r "$code" '[.plans[]|select((.locations|index($r)) and .ram>=1024)]|sort_by(.monthly_cost)[0].id // empty')"
  [ -n "$plan" ] || { info "skip $code — no regular-CPU plan available"; continue; }
  cost="$(printf '%s' "$plans_json" | jq -r --arg p "$plan" '.plans[]|select(.id==$p)|.monthly_cost')"
  info "creating responder in $code  (plan $plan, \$$cost/mo)..."
  body="$(jq -n --arg r "$code" --arg p "$plan" --arg o "$os_id" --arg u "$user_data" --arg t "$PROBE_TAG" \
    '{region:$r, plan:$p, os_id:($o|tonumber), label:("proxima-probe-"+$r), hostname:("probe-"+$r), tags:[$t], backups:"disabled", user_data:$u}')"
  id="$(api POST /instances "$body" | jq -r '.instance.id')"
  ids+=("$id"); regions+=("$code")
done

[ "${#ids[@]}" -ge 1 ] || die "nothing created"

echo "Waiting for IP addresses..." >&2
ips=(); for _ in "${ids[@]}"; do ips+=("PENDING"); done
for _ in $(seq 1 40); do
  pending=0
  for i in "${!ids[@]}"; do
    [ "${ips[$i]}" != "PENDING" ] && continue
    ip="$(api GET "/instances/${ids[$i]}" | jq -r '.instance.main_ip')"
    if [ "$ip" != "0.0.0.0" ] && [ -n "$ip" ] && [ "$ip" != "null" ]; then ips[$i]="$ip"; else pending=1; fi
  done
  [ "$pending" -eq 0 ] && break
  sleep 6
done

# Emit PROXIMA_REGION_ENDPOINTS JSON (mesh-id -> https://<ip>.sslip.io). Caddy
# needs ~30-60s after boot to fetch a cert; the app (and the browser) tolerate a
# not-yet-up endpoint by falling back to modeled RTT until it answers.
echo >&2
echo "PROXIMA_REGION_ENDPOINTS (paste into the app host env):" >&2
json="{"; first=1
for i in "${!ids[@]}"; do
  code="${regions[$i]}"; host="$(echo "${ips[$i]}" | tr . -).sslip.io"
  [ "$first" -eq 1 ] || json="$json,"; first=0
  json="$json\"$code\":\"https://$host\""
done
json="$json}"
echo "$json"
echo >&2
echo "Instances tagged '$PROBE_TAG'. Tear down with: ./probes-down.sh" >&2
