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
install() { mutable; (cd "$CANDIDATE"; bun install --frozen-lockfile); }
build() { (cd "$CANDIDATE"; bun run lint; bun run build); }
tests() {
  if (cd "$CANDIDATE"; bun -e 'process.exit(JSON.parse(require("fs").readFileSync("package.json","utf8")).scripts.test ? 0 : 1)'); then
    (cd "$CANDIDATE"; bun run test)
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
logs) owned; sudo -n tail -n 40 /var/log/nginx/fanarlool.access.log /var/log/nginx/fanarlool.error.log ;;
health) owned; health ;;
version) owned; readlink -f "$ROOT/current"; cat "$ROOT/current/dist/version.txt" ;;
fetch|install|build|test|validate|deploy|nginx|edge|rollback)
  owned; lock; fetch
  case "$ACTION" in
  fetch) ;;
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
    switch_release "$CANDIDATE"
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
    switch_release "$target"; health
    ;;
  esac
  ;;
*) fail 'Unknown operation' ;;
esac
