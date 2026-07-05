#!/usr/bin/env bash
# Provision (once) and deploy the always-on Proxima app host on Vultr.
#   ./app-deploy.sh '<PROXIMA_REGION_ENDPOINTS json or empty>'
#
# - First run: creates ONE small instance (tag proxima-app, ~$5–6/mo), installs
#   Node + Caddy, injects your SSH key, and gets free HTTPS via <ip>.sslip.io.
# - Re-runs: reuse the existing app host — rebuilds locally and ships a fresh
#   bundle. Pass a new endpoints JSON to update which regions are real-RTT.
# Builds a self-contained Next standalone bundle locally and ships it (no build,
# no node_modules, no repo pull on the box).
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env

ENDPOINTS_JSON="${1:-${PROXIMA_REGION_ENDPOINTS:-}}"
PUBKEY_FILE="$(default_pubkey)"
[ -f "$PUBKEY_FILE" ] || die "no SSH pubkey at $PUBKEY_FILE (set PROXIMA_SSH_PUBKEY in deploy/.env)"
PUBKEY="$(cat "$PUBKEY_FILE")"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$DEPLOY_DIR/.known_hosts" -o ConnectTimeout=10)

# --- 1. Find or create the app host -----------------------------------------
existing="$(api GET "/instances?tag=$APP_TAG&per_page=100")"
ip="$(printf '%s' "$existing" | jq -r '.instances[0].main_ip // empty')"
if [ -n "$ip" ] && [ "$ip" != "0.0.0.0" ]; then
  echo "Reusing existing app host: $ip" >&2
else
  echo "Provisioning a new app host..." >&2
  regions_json="$(api GET /regions)"; plans_json="$(api GET /plans?type=vc2)"
  os_id="$(api GET "/os?per_page=500" | jq -r '.os[]|select(.name|test("Ubuntu 24.04.*x64")).id' | head -1)"
  # A US-east region with a >=1GB plan; fall back to the cheapest 1GB anywhere.
  region="$(printf '%s' "$regions_json" | jq -r '.regions[].id' | grep -E '^(ewr|atl|ord)$' | head -1)"
  region="${region:-ewr}"
  plan="$(printf '%s' "$plans_json" | jq -r --arg r "$region" \
    '[.plans[]|select((.locations|index($r)) and .ram>=1024 and (.id|startswith("vc2")))]|sort_by(.monthly_cost)[0].id')"
  [ -n "$plan" ] && [ "$plan" != "null" ] || die "no >=1GB plan in $region"
  ci="$(printf '#cloud-config\nssh_authorized_keys:\n  - %s\npackage_update: true\nruncmd:\n  - curl -fsSL https://deb.nodesource.com/setup_22.x | bash -\n  - apt-get install -y nodejs debian-keyring debian-archive-keyring apt-transport-https curl\n  - curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg\n  - curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | tee /etc/apt/sources.list.d/caddy-stable.list\n  - apt-get update && apt-get install -y caddy\n  - ufw allow 80/tcp\n  - ufw allow 443/tcp\n' "$PUBKEY" | base64 | tr -d '\n')"
  body="$(jq -n --arg r "$region" --arg p "$plan" --arg o "$os_id" --arg u "$ci" --arg t "$APP_TAG" \
    '{region:$r, plan:$p, os_id:($o|tonumber), label:"proxima-app", hostname:"proxima-app", tags:[$t], backups:"disabled", user_data:$u}')"
  id="$(api POST /instances "$body" | jq -r '.instance.id')"
  info "created app host $id in $region (plan $plan) — waiting for IP..."
  for _ in $(seq 1 40); do
    ip="$(api GET "/instances/$id" | jq -r '.instance.main_ip')"
    [ "$ip" != "0.0.0.0" ] && [ -n "$ip" ] && [ "$ip" != "null" ] && break; sleep 6
  done
  [ "$ip" != "0.0.0.0" ] || die "app host never got an IP"
  info "app host IP: $ip — waiting for cloud-init (Node + Caddy)..."
fi

HOST="${PROXIMA_DOMAIN:-${ip//./-}.sslip.io}"

# --- 2. Wait for SSH ---------------------------------------------------------
echo "Waiting for SSH on $ip..." >&2
for _ in $(seq 1 60); do
  ssh "${SSH_OPTS[@]}" "root@$ip" 'command -v node >/dev/null && command -v caddy >/dev/null' 2>/dev/null && break
  sleep 8
done
ssh "${SSH_OPTS[@]}" "root@$ip" 'node -v && caddy version' >/dev/null 2>&1 || die "host not ready (node/caddy missing) — cloud-init may still be running; re-run in a minute"

# --- 3. Build the standalone bundle locally ---------------------------------
cd "$REPO_DIR"
if [ "${SKIP_BUILD:-}" = "1" ] && [ -f .next/standalone/server.js ]; then
  echo "Reusing existing standalone build (SKIP_BUILD=1)..." >&2
else
  echo "Building app (next standalone)..." >&2
  [ -d node_modules ] || npm ci
  npm run build >/dev/null
fi
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static
tar czf "$DEPLOY_DIR/.bundle.tgz" -C .next/standalone .

# --- 4. Ship it + configure services ----------------------------------------
echo "Shipping bundle to $ip..." >&2
scp "${SSH_OPTS[@]}" "$DEPLOY_DIR/.bundle.tgz" "root@$ip:/tmp/proxima.tgz" >/dev/null
ENDPOINTS_JSON="${ENDPOINTS_JSON:-}"; [ -n "$ENDPOINTS_JSON" ] || ENDPOINTS_JSON='{}'
ENV_LINE="PROXIMA_REGION_ENDPOINTS=$ENDPOINTS_JSON"

ssh "${SSH_OPTS[@]}" "root@$ip" "HOST='$HOST' ENV_LINE='$ENV_LINE' bash -s" <<'REMOTE'
set -euo pipefail
rm -rf /opt/proxima && mkdir -p /opt/proxima
tar xzf /tmp/proxima.tgz -C /opt/proxima && rm /tmp/proxima.tgz
cat >/opt/proxima/.env <<EOF
PORT=3000
HOSTNAME=127.0.0.1
$ENV_LINE
EOF
cat >/etc/systemd/system/proxima.service <<EOF
[Unit]
Description=Proxima app
After=network.target
[Service]
WorkingDirectory=/opt/proxima
EnvironmentFile=/opt/proxima/.env
ExecStart=/usr/bin/node /opt/proxima/server.js
Restart=always
[Install]
WantedBy=multi-user.target
EOF
cat >/etc/caddy/Caddyfile <<EOF
$HOST {
	reverse_proxy 127.0.0.1:3000
}
EOF
systemctl daemon-reload
systemctl enable --now proxima
systemctl restart proxima
systemctl reload caddy || systemctl restart caddy
REMOTE

rm -f "$DEPLOY_DIR/.bundle.tgz"
echo >&2
echo "✓ Deployed. App host: $ip" >&2
echo "  URL: https://$HOST" >&2
echo "  (first HTTPS hit may take ~30s while Caddy fetches a Let's Encrypt cert)" >&2
[ "${ENDPOINTS_JSON:-}" = "" ] && echo "  Regions are all MODELED (no probe endpoints passed). Run probes-up.sh then re-run this with the JSON to make regions real." >&2
