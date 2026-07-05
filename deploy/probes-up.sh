#!/usr/bin/env bash
# Stand up real-RTT probe responders in one or more Vultr regions.
#   ./probes-up.sh fra nrt gru syd ewr sjc
# Picks the cheapest regular-CPU plan available in each region, boots a tiny
# HEAD-200 responder via cloud-init, waits for IPs, and prints a ready-to-paste
# PROXIMA_REGION_ENDPOINTS JSON. These are BILLABLE (~$0.004–0.005/hr each) —
# run ./probes-down.sh to destroy them all when the demo is over.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env

[ "$#" -ge 1 ] || die "usage: ./probes-up.sh <region> [region...]   e.g. ./probes-up.sh fra nrt gru syd"

echo "Resolving Vultr catalog…" >&2
regions_json="$(api GET /regions)"
plans_json="$(api GET /plans?type=vc2)"
os_json="$(api GET /os?per_page=500)"
os_id="$(printf '%s' "$os_json" | jq -r '.os[] | select(.name|test("Ubuntu 24.04.*x64")) | .id' | head -1)"
[ -n "$os_id" ] && [ "$os_id" != "null" ] || die "could not find Ubuntu 24.04 x64 OS id"

valid_vultr="$(printf '%s' "$regions_json" | jq -r '.regions[].id')"
valid_mesh="$(mesh_region_ids)"

# Build cloud-init once (responder.py indented into a write_files block).
py_indented="$(sed 's/^/      /' "$DEPLOY_DIR/responder/responder.py")"
cloud_init="$(cat <<EOF
#cloud-config
write_files:
  - path: /opt/responder.py
    permissions: '0755'
    content: |
$py_indented
  - path: /etc/systemd/system/responder.service
    content: |
      [Unit]
      Description=Proxima probe responder
      After=network.target
      [Service]
      ExecStart=/usr/bin/python3 /opt/responder.py
      Restart=always
      [Install]
      WantedBy=multi-user.target
runcmd:
  - systemctl daemon-reload
  - systemctl enable --now responder
EOF
)"
user_data="$(printf '%s' "$cloud_init" | base64 | tr -d '\n')"

created_ids=()
declare -A region_of
for code in "$@"; do
  grep -qx "$code" <<<"$valid_vultr" || { info "skip $code — not a Vultr region"; continue; }
  grep -qx "$code" <<<"$valid_mesh"  || info "note: $code is a Vultr region but not a mesh id — endpoint won't bind to a mesh region"
  # cheapest vc2 plan offered in this region
  plan="$(printf '%s' "$plans_json" \
    | jq -r --arg r "$code" '[.plans[]|select(.locations|index($r))]|sort_by(.monthly_cost)[0].id // empty')"
  [ -n "$plan" ] || { info "skip $code — no regular-CPU plan available"; continue; }
  cost="$(printf '%s' "$plans_json" | jq -r --arg p "$plan" '.plans[]|select(.id==$p)|.monthly_cost')"
  info "creating responder in $code  (plan $plan, \$$cost/mo)…"
  body="$(jq -n --arg r "$code" --arg p "$plan" --arg o "$os_id" --arg u "$user_data" --arg t "$PROBE_TAG" \
    '{region:$r, plan:$p, os_id:($o|tonumber), label:("proxima-probe-"+$r), hostname:("probe-"+$r), tags:[$t], backups:"disabled", user_data:$u}')"
  id="$(api POST /instances "$body" | jq -r '.instance.id')"
  created_ids+=("$id"); region_of["$id"]="$code"
done

[ "${#created_ids[@]}" -ge 1 ] || die "nothing created"

echo "Waiting for IP addresses…" >&2
declare -A ip_of
for _ in $(seq 1 40); do
  pending=0
  for id in "${created_ids[@]}"; do
    [ -n "${ip_of[$id]:-}" ] && continue
    ip="$(api GET "/instances/$id" | jq -r '.instance.main_ip')"
    if [ "$ip" != "0.0.0.0" ] && [ -n "$ip" ] && [ "$ip" != "null" ]; then ip_of["$id"]="$ip"; else pending=1; fi
  done
  [ "$pending" -eq 0 ] && break
  sleep 6
done

# Emit PROXIMA_REGION_ENDPOINTS JSON (mesh-id -> http://ip). Responder boots a
# few seconds after the IP appears; the app tolerates a not-yet-up endpoint by
# falling back to modeled RTT until it answers.
echo >&2
echo "PROXIMA_REGION_ENDPOINTS (paste into the app host env):" >&2
json="{"; first=1
for id in "${created_ids[@]}"; do
  code="${region_of[$id]}"; ip="${ip_of[$id]:-PENDING}"
  [ "$first" -eq 1 ] || json="$json,"; first=0
  json="$json\"$code\":\"http://$ip\""
done
json="$json}"
echo "$json"
echo >&2
echo "Instances tagged '$PROBE_TAG'. Tear down with: ./probes-down.sh" >&2
