#!/usr/bin/env bash
set -Eeuo pipefail
umask 022
ROOT=/var/www/fanarlool
URL=https://github.com/DeveloperCodeBase/fanarlool.git
DOMAIN=fanarlool.vistapower.ir
EDGE_CONFIG=/home/ubuntu/Desktop/magazine/deploy/Caddyfile
ACTION=${1:-status}
SHA=${2:--}
export PATH="$ROOT/shared/bun/bin:$PATH"
fail() { echo "FAIL: $*" >&2; exit 1; }
owned() {
  [[ -d $ROOT && ! -L $ROOT && -f $ROOT/.fanarlool-owned ]] || fail 'Deployment root has no ownership marker'
  [[ $(cat "$ROOT/.fanarlool-owned") == "$URL" ]] || fail 'Ownership mismatch'
  [[ $(git -C "$ROOT/repo" remote get-url origin) == "$URL" ]] || fail 'Repository origin mismatch'
}
exact() { [[ $SHA =~ ^[0-9a-f]{40}$ ]] || fail 'Exact SHA required'; }
lock() { exec 9>"$ROOT/shared/operation.lock"; flock -n 9 || fail 'Another FanarLool operation is running'; }
fetch() {
  exact
  git -C "$ROOT/repo" fetch --prune origin
  [[ $(git -C "$ROOT/repo" rev-parse "$SHA^{commit}") == "$SHA" ]] || fail 'Unknown commit'
  git -C "$ROOT/repo" branch -r --contains "$SHA" | grep -q 'origin/' || fail 'SHA is not on a fetched origin branch'
  CANDIDATE="$ROOT/releases/$SHA"
  if [[ ! -d $CANDIDATE ]]; then git -C "$ROOT/repo" worktree add --detach "$CANDIDATE" "$SHA"; fi
  [[ ! -L $CANDIDATE && $(git -C "$CANDIDATE" rev-parse HEAD) == "$SHA" ]] || fail 'Candidate identity mismatch'
  [[ -z $(git -C "$CANDIDATE" status --porcelain --untracked-files=normal) ]] || fail 'Candidate source is dirty'
}
mutable() {
  [[ ! -e $CANDIDATE/VALIDATED && $(readlink -f "$ROOT/current" 2>/dev/null || true) != "$CANDIDATE" ]] || fail 'Validated/active releases cannot be rebuilt'
}
install() { mutable; (cd "$CANDIDATE"; timeout 300 bun install --frozen-lockfile); }
build() { (cd "$CANDIDATE"; timeout 300 bun run lint; timeout 300 bun run build); }
tests() {
  if python3 -c 'import json,sys; sys.exit(0 if json.load(open(sys.argv[1])).get("scripts",{}).get("test") else 1)' "$CANDIDATE/package.json"; then
    (cd "$CANDIDATE"; timeout 300 bun run test)
  else echo 'TEST=SKIP (no test script)'; fi
}
bundle() {
  [[ -s $CANDIDATE/dist/index.html && -s $CANDIDATE/dist/logo.png ]] || fail 'Missing index/logo'
  python3 - "$CANDIDATE/dist" <<'PY'
import pathlib, re, sys
root = pathlib.Path(sys.argv[1])
page = (root / 'index.html').read_text()
assets = re.findall(r'(?:src|href)="(/assets/[^"?#]+)', page)
assert assets and any(x.endswith('.js') for x in assets), 'No production JS'
for asset in assets:
    assert (root / asset.lstrip('/')).is_file(), asset
assert '/src/main.tsx' not in page, 'Development entrypoint'
print('BUNDLE=PASS', len(assets), 'assets')
PY
}
switch_release() {
  local target=$1
  [[ $target == "$ROOT/releases/"* && -s $target/dist/index.html && -f $target/VALIDATED ]] || fail 'Invalid release target'
  [[ ! -e $ROOT/current || -L $ROOT/current ]] || fail 'current is not a managed symlink'
  if [[ $(readlink -f "$ROOT/current" 2>/dev/null || true) == "$target" ]]; then
    echo "DEPLOYED_SHA=$(cat "$target/dist/version.txt") (already active; rollback preserved)"
    return
  fi
  if [[ -L $ROOT/current ]]; then
    local previous; previous=$(readlink -f "$ROOT/current")
    [[ $previous == "$ROOT/releases/"* && -f $previous/VALIDATED ]] || fail 'Unowned current release'
    ln -s "$previous" "$ROOT/.previous.next"; mv -Tf "$ROOT/.previous.next" "$ROOT/previous"
  fi
  ln -s "$target" "$ROOT/.current.next"; mv -Tf "$ROOT/.current.next" "$ROOT/current"
  echo "DEPLOYED_SHA=$(cat "$ROOT/current/dist/version.txt")"
}
health() {
  local base="https://$DOMAIN" path
  curl --fail --silent --show-error --max-time 30 "$base/" -o /dev/null
  [[ -L $ROOT/current ]] || fail 'No deployed release'
  local expected actual; expected=$(cat "$ROOT/current/dist/version.txt"); actual=$(curl -fsS --max-time 30 "$base/version.txt")
  [[ $expected == "$actual" ]] || fail 'Public SHA mismatch'
  for path in /logo.png $(python3 - "$ROOT/current/dist/index.html" <<'PY'
import re, sys
print(' '.join(re.findall(r'(?:src|href)="(/assets/[^"?#]+)', open(sys.argv[1]).read())))
PY
  ); do curl -fsS --max-time 30 "$base$path" -o /dev/null; done
  local status; status=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$base/assets/nonexistent.js")
  [[ $status == 404 ]] || fail 'Missing asset does not return 404'
  status=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "http://$DOMAIN/")
  [[ $status == 308 || $status == 301 ]] || fail 'HTTP does not redirect to HTTPS'
  [[ $(curl -sS --max-time 30 -o /dev/null -w '%{redirect_url}' "http://$DOMAIN/") == "$base/" ]] || fail 'Wrong HTTPS redirect target'
  curl -fsS --max-time 30 "$base/logo.jpg" -o /dev/null
  status=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$base/assets/")
  [[ $status == 403 || $status == 404 ]] || fail 'Asset directory listing is exposed'
  status=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$base/.git/config")
  [[ $status == 403 || $status == 404 ]] || fail 'Hidden source file is exposed'
  sudo -n nginx -t
  if [[ -f $ROOT/current/server/index.mjs ]]; then
    curl -fsS --max-time 30 "$base/api/health" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["status"]=="ok" and d["sha"]==sys.argv[1]; print("API_HEALTH=PASS")' "$expected"
    status=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$base/api/workspace")
    [[ $status == 401 ]] || fail 'Anonymous workspace is not denied'
    python3 - "$base" <<'PY'
import urllib.request, urllib.error, http.cookiejar, json, sys
base=sys.argv[1]
def client(): return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(opener,path,method='GET',body=None,csrf=None):
    headers={'Origin':base}
    if body is not None: headers['Content-Type']='application/json'
    if csrf: headers['X-CSRF-Token']=csrf
    req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
    try:
        with opener.open(req,timeout=20) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as error:return error.code,json.load(error)
opener=client();first=None
for role in ['admin','executive','production','quality','maintenance','energy','engineering','auditor']:
    status,login=call(opener,'/api/demo/auth/login','POST',{'username':'demo.'+role,'password':'FanarDemo-2026!'})
    assert status==200 and login['user']['role']==role,(role,status)
    status,workspace=call(opener,'/api/demo/workspace')
    assert status==200 and workspace['mode']=='demo'
    permitted={item['kind'] for item in workspace['catalog']}
    assert workspace['records'] and all(row['kind'] in permitted for row in workspace['records'])
    assert all(any(row['kind']==kind for row in workspace['records']) for kind in permitted)
    if role=='admin':assert len(workspace['records'])==98
    sample=workspace['records'][0]
    status,history=call(opener,'/api/demo/records/'+sample['id']+'/history')
    assert status==200 and history['recordId']==sample['id'] and history['events']
    status,profile=call(opener,'/api/demo/profile');assert status==200 and profile['user']['id']==login['user']['id']
    status,activity=call(opener,'/api/demo/activity');assert status==200 and all(e['actor']==login['user']['id'] for e in activity['events'])
    status,monitor=call(opener,'/api/demo/system');assert status==(200 if role=='admin' else 403)
    assert call(opener,'/api/workspace')[0]==401
    if first is None:first=workspace['records'][0]['id']
    assert call(opener,'/api/demo/auth/logout','POST',{},login['csrf'])[0]==200
    print('DEMO_ROLE=PASS',role)
other=client();assert call(other,'/api/demo/auth/login','POST',{'username':'demo.admin','password':'FanarDemo-2026!'})[0]==200
assert call(other,'/api/demo/workspace')[1]['records'][0]['id']!=first
print('DEMO_BROWSER_ISOLATION=PASS')
PY
    api_pid=$(systemctl show -p MainPID --value fanarlool-api)
    [[ $api_pid =~ ^[1-9][0-9]*$ ]] || fail 'API process is not running'
    if sudo -n ss -Hltnp | grep -q "pid=$api_pid,"; then fail 'Unexpected API TCP listener'; fi
    echo 'API_TCP_LISTENER=NONE'
  fi
  for neighbor in vistapower.ir refah.vistapower.ir; do
    status=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "https://$neighbor/")
    echo "NEIGHBOR_DOMAIN=$neighbor STATUS=$status"
  done
  echo "HEALTH=PASS SHA=$actual"
}
case "$ACTION" in
status)
  cat /etc/os-release
  df -h /var/www; free -h
  for tool in node bun nginx certbot git python3 unzip; do command -v "$tool" || true; done
  node --version 2>/dev/null || true; bun --version 2>/dev/null || true
  sudo -n nginx -v 2>&1 || true
  sudo -n ss -Hltnp | awk '{print $4, $6}' | sort -u
  systemctl list-units --type=service --state=running --no-pager
  if command -v docker >/dev/null; then sudo -n docker ps --format '{{.Names}} {{.Ports}}'; fi
  ls -ld /var/www "$ROOT" 2>/dev/null || true
  if [[ -d $ROOT ]]; then ls -la "$ROOT"; fi
  sudo -n sh -c 'ls -l /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null; grep -R -n fanarlool.vistapower.ir /etc/nginx 2>/dev/null' || true
  if [[ -L $ROOT/current ]]; then cat "$ROOT/current/dist/version.txt"; fi
  sudo -n grep -nE 'include|listen|server_name|root' /etc/nginx/nginx.conf /etc/nginx/sites-enabled/direct-download || true
  sudo -n docker inspect hooshgate_caddy --format '{{range .Mounts}}{{println .Source " -> " .Destination}}{{end}}'
  sudo -n docker exec hooshgate_caddy caddy version
  sudo -n docker inspect hooshgate_caddy --format '{{range $name, $network := .NetworkSettings.Networks}}{{println $name $network.Gateway}}{{end}}'
  sudo -n grep -nE '^([a-zA-Z0-9*]|[[:space:]]*(import|reverse_proxy|tls|bind|admin|email))' /home/ubuntu/Desktop/magazine/deploy/Caddyfile
  curl -sS --max-time 20 -I "https://$DOMAIN/" || true
  if [[ -f $ROOT/shared/edge-before.caddy ]]; then
    sudo -n python3 - "$ROOT/shared/edge-before.caddy" "$EDGE_CONFIG" <<'PY'
import pathlib, sys
before, after = [pathlib.Path(p).read_bytes() for p in sys.argv[1:]]
print('EDGE_PREEXISTING_BYTES_PRESERVED=' + str(after.startswith(before)))
PY
  fi
  ;;
bootstrap)
  for tool in git curl unzip python3 flock; do command -v "$tool" >/dev/null || fail "Missing tool $tool"; done
  sudo -n nginx -t
  if [[ -e $ROOT ]]; then
    [[ ! -L $ROOT ]] || fail 'Deployment root is a symlink'
    if [[ ! -f $ROOT/.fanarlool-owned ]]; then
      [[ -z $(find "$ROOT" -mindepth 1 -maxdepth 1 -print -quit) && -O $ROOT ]] || fail 'Existing root is not empty and owned'
      printf '%s\n' "$URL" > "$ROOT/.fanarlool-owned"
      mkdir -p "$ROOT/shared" "$ROOT/releases"
      git clone "$URL" "$ROOT/repo"
    fi
    owned
  else
    sudo -n install -d -o "$(id -un)" -g "$(id -gn)" -m 755 "$ROOT"
    printf '%s\n' "$URL" > "$ROOT/.fanarlool-owned"
    mkdir -p "$ROOT/shared" "$ROOT/releases"
    git clone "$URL" "$ROOT/repo"
  fi
  lock
  if [[ ! -x $ROOT/shared/bun/bin/bun ]]; then
    curl -fsSL https://bun.sh/install -o "$ROOT/shared/bun-install.sh"
    BUN_INSTALL="$ROOT/shared/bun" bash "$ROOT/shared/bun-install.sh" bun-v1.4.2
  fi
  bun --version; echo 'BOOTSTRAP=PASS'
  ;;
logs) owned; sudo -n tail -n 40 /var/log/nginx/fanarlool.access.log /var/log/nginx/fanarlool.error.log; sudo -n journalctl -u fanarlool-api --no-pager -n 15 ;;
health) owned; health ;;
version) owned; readlink -f "$ROOT/current"; cat "$ROOT/current/dist/version.txt" ;;
admin)
  owned; exact; lock
  [[ $(readlink -f "$ROOT/current") == "$ROOT/releases/$SHA" ]] || fail 'Administrator provisioning requires the active SHA'
  [[ $(cat "$ROOT/current/dist/version.txt") == "$SHA" && -f $ROOT/current/VALIDATED ]] || fail 'Active release identity is not validated'
  FANAR_DATA_ROOT="$ROOT/shared/data" /usr/bin/node "$ROOT/current/server/admin.mjs"
  ;;
fetch|install|build|test|validate|deploy|nginx|edge|platform|backup|rollback|train)
  owned; lock; fetch
  case "$ACTION" in
  fetch) ;;
  train) (cd "$CANDIDATE"; timeout 180 nice -n 10 /usr/bin/node scripts/train-reference.mjs "$ROOT/shared/models/$SHA") ;;
  install) install ;;
  build) install; build; bundle ;;
  test) install; tests ;;
  validate)
    [[ $(readlink -f "$ROOT/current" 2>/dev/null || true) != "$CANDIDATE" ]] || fail 'Do not rebuild active production release'
    [[ ! -e $CANDIDATE/VALIDATED ]] || fail 'Release already validated; use it or push a new SHA'
    install; build; tests; bundle
    printf '%s\n' "$SHA" > "$CANDIDATE/dist/version.txt"
    (cd "$CANDIDATE/dist"; find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$CANDIDATE/BUNDLE.sha256"
    printf '%s\n' "$SHA" > "$CANDIDATE/VALIDATED"
    echo "VALIDATE=PASS SHA=$SHA BUN=$(bun --version)"
    ;;
  deploy)
    [[ $(cat "$CANDIDATE/VALIDATED") == "$SHA" ]] || fail 'No validation evidence'
    (cd "$CANDIDATE/dist"; sha256sum --quiet -c ../BUNDLE.sha256)
    sudo -n nginx -t
    if [[ -f $CANDIDATE/server/index.mjs ]]; then
      [[ -f /etc/systemd/system/fanarlool-api.service ]] || fail 'Run platform provisioning first'
      if [[ -f $ROOT/shared/data/platform.sqlite ]]; then
        backup_dir="$ROOT/shared/backups/$(date -u +%Y%m%dT%H%M%SZ)-$SHA"; mkdir -p "$backup_dir"; chmod 700 "$backup_dir"
        python3 - "$ROOT/shared/data/platform.sqlite" "$backup_dir/platform.sqlite" <<'PY'
import sqlite3, sys, os
source=sqlite3.connect(sys.argv[1]); target=sqlite3.connect(sys.argv[2]); source.backup(target)
assert target.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
target.close(); source.close(); os.chmod(sys.argv[2],0o600)
print('DB_BACKUP=PASS',sys.argv[2])
PY
      fi
      printf 'FANAR_DATA_ROOT=%s/shared/data\nFANAR_SOCKET=/run/fanarlool/api.sock\nFANAR_ORIGIN=https://%s\nFANAR_SHA=%s\n' "$ROOT" "$DOMAIN" "$SHA" > "$ROOT/shared/api.env.next"
      chmod 600 "$ROOT/shared/api.env.next"; mv "$ROOT/shared/api.env.next" "$ROOT/shared/api.env"
    fi
    old_current=$(readlink -f "$ROOT/current" 2>/dev/null || true)
    switch_release "$CANDIDATE"
    if [[ -f $CANDIDATE/server/index.mjs ]]; then
      sudo -n systemctl restart fanarlool-api
      for attempt in 1 2 3 4 5; do
        if curl -fsS --unix-socket /run/fanarlool/api.sock http://localhost/api/health >/dev/null 2>/dev/null; then break; fi
        sleep 1
      done
      if ! curl -fsS --unix-socket /run/fanarlool/api.sock http://localhost/api/health >/dev/null; then
        if [[ -n $old_current ]]; then
          ln -s "$old_current" "$ROOT/.current.next"; mv -Tf "$ROOT/.current.next" "$ROOT/current"
          if [[ -f $old_current/server/index.mjs ]]; then
            sed -i "s/^FANAR_SHA=.*/FANAR_SHA=$(cat "$old_current/dist/version.txt")/" "$ROOT/shared/api.env"
            sudo -n systemctl restart fanarlool-api
          else sudo -n systemctl stop fanarlool-api; fi
        fi
        fail 'API failed to start; previous application restored'
      fi
    fi
    ;;
  platform)
    [[ $(cat "$CANDIDATE/VALIDATED") == "$SHA" ]] || fail 'Validate candidate before provisioning'
    [[ -f $CANDIDATE/ops/systemd/fanarlool-api.service ]] || fail 'Platform service definition missing'
    config=/etc/nginx/sites-available/fanarlool
    sudo -n grep -q '^# FanarLool dedicated' "$config" || fail 'Nginx config ownership is not proven'
    if [[ -f /etc/systemd/system/fanarlool-api.service ]]; then
      sudo -n grep -q '^Description=FanarLool isolated platform API' /etc/systemd/system/fanarlool-api.service || fail 'Existing service ownership mismatch'
    fi
    mkdir -p "$ROOT/shared/data" "$ROOT/shared/backups"; chmod 700 "$ROOT/shared/data" "$ROOT/shared/backups"
    sudo -n cp "$config" "$ROOT/shared/nginx-before-platform.conf"
    sudo -n install -m 644 "$CANDIDATE/ops/nginx/fanarlool.conf" "$config"
    if ! sudo -n nginx -t; then
      sudo -n cp "$ROOT/shared/nginx-before-platform.conf" "$config"; fail 'Nginx syntax failed; restored'
    fi
    sudo -n systemd-analyze verify "$CANDIDATE/ops/systemd/fanarlool-api.service"
    sudo -n install -m 644 "$CANDIDATE/ops/systemd/fanarlool-api.service" /etc/systemd/system/fanarlool-api.service
    sudo -n systemctl daemon-reload
    sudo -n systemctl enable fanarlool-api
    sudo -n systemctl reload nginx
    echo 'PLATFORM_PROVISION=PASS (Unix socket; no TCP listener)'
    ;;
  backup)
    [[ -f $ROOT/shared/data/platform.sqlite ]] || fail 'No platform database yet'
    backup_file="$ROOT/shared/backups/manual-$(date -u +%Y%m%dT%H%M%SZ).sqlite"
    python3 - "$ROOT/shared/data/platform.sqlite" "$backup_file" <<'PY'
import sqlite3, sys, os
s=sqlite3.connect(sys.argv[1]); t=sqlite3.connect(sys.argv[2]); s.backup(t)
assert t.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
t.close(); s.close(); os.chmod(sys.argv[2],0o600)
print('DB_BACKUP=PASS',sys.argv[2])
PY
    ;;
  nginx)
    [[ -L $ROOT/current ]] || fail 'Deploy a validated release first'
    config=/etc/nginx/sites-available/fanarlool
    [[ ! -e $config && ! -e /etc/nginx/sites-enabled/fanarlool ]] || fail 'Existing config: inspect ownership, do not overwrite'
    if sudo -n grep -R -l "$DOMAIN" /etc/nginx/sites-enabled /etc/nginx/conf.d; then fail 'Hostname collision'; fi
    sudo -n install -m 644 "$CANDIDATE/ops/nginx/fanarlool.conf" "$config"
    sudo -n ln -s "$config" /etc/nginx/sites-enabled/fanarlool
    if ! sudo -n nginx -t; then
      sudo -n rm /etc/nginx/sites-enabled/fanarlool "$config"
      fail 'Nginx syntax rejected; new config removed'
    fi
    sudo -n systemctl reload nginx
    ;;
  edge)
    [[ -f /etc/nginx/sites-available/fanarlool ]] || fail 'Dedicated Nginx host missing'
    python3 - <<'PY'
import socket
addresses = {x[4][0] for x in socket.getaddrinfo('fanarlool.vistapower.ir', 80)}
assert addresses == {'193.163.201.141'}, f'DNS mismatch: {addresses}'
print('DNS=PASS', addresses)
PY
    [[ $(sudo -n docker inspect hooshgate_caddy --format '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}') == "$EDGE_CONFIG" ]] || fail 'Edge config mount changed'
    sudo -n docker inspect hooshgate_caddy --format '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}' | grep -qx '172.18.0.1' || fail 'Edge gateway changed'
    sudo -n docker exec hooshgate_caddy wget -q -O - --header="Host: $DOMAIN" http://172.18.0.1:8080/version.txt | grep -qx "$SHA" || fail 'Edge cannot reach dedicated origin'
    [[ ! -e $ROOT/shared/edge-before.caddy ]] || fail 'Edge setup already attempted: inspect existing evidence'
    sudo -n cp "$EDGE_CONFIG" "$ROOT/shared/edge-before.caddy"
    sudo -n python3 - "$EDGE_CONFIG" "$CANDIDATE/ops/caddy/fanarlool.caddy" "$ROOT/shared/edge-candidate.caddy" <<'PY'
import pathlib, sys
source, snippet, target = map(pathlib.Path, sys.argv[1:])
content = source.read_bytes()
assert b'fanarlool.vistapower.ir' not in content, 'Existing edge hostname collision'
target.write_bytes(content + b'\n' + snippet.read_bytes())
PY
    sudo -n docker cp "$ROOT/shared/edge-candidate.caddy" hooshgate_caddy:/tmp/fanarlool-candidate.caddy
    sudo -n docker exec hooshgate_caddy caddy validate --config /tmp/fanarlool-candidate.caddy --adapter caddyfile
    sudo -n cmp -s "$EDGE_CONFIG" "$ROOT/shared/edge-before.caddy" || fail 'Shared config changed concurrently'
    sudo -n sh -c 'cat "$1" > "$2"' sh "$ROOT/shared/edge-candidate.caddy" "$EDGE_CONFIG"
    if ! sudo -n docker exec hooshgate_caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
      sudo -n sh -c 'cat "$1" > "$2"' sh "$ROOT/shared/edge-before.caddy" "$EDGE_CONFIG"
      sudo -n docker exec hooshgate_caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
      fail 'Edge reload failed; original config restored'
    fi
    echo 'EDGE=PASS (Caddy automatic HTTPS; run health after issuance)'
    ;;
  rollback)
    [[ -L $ROOT/previous ]] || fail 'No previous release'
    target=$(readlink -f "$ROOT/previous")
    [[ $target == "$ROOT/releases/$SHA" ]] || fail 'Rollback SHA does not match previous release'
    (cd "$target/dist"; sha256sum --quiet -c ../BUNDLE.sha256)
    switch_release "$target"
    if [[ -f $target/server/index.mjs ]]; then
      sed -i "s/^FANAR_SHA=.*/FANAR_SHA=$SHA/" "$ROOT/shared/api.env"
      sudo -n systemctl restart fanarlool-api
    elif [[ -f /etc/systemd/system/fanarlool-api.service ]]; then sudo -n systemctl stop fanarlool-api; fi
    health
    ;;
  esac
  ;;
*) fail 'Unknown operation' ;;
esac
