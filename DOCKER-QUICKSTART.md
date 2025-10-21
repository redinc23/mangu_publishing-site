# Docker Quickstart — mangu2-publishing

This project ships with Apple Silicon–friendly Docker defaults plus helper scripts that auto‑recover when Docker isn’t running.

## TL;DR

```bash
# 0) Start Docker Desktop (macOS) or the docker service (Linux)
# 1) From the repo root:
./start-dev.sh
# 2) Verify everything:
./test-setup.sh
# 3) Work as usual:
docker compose logs -f
docker compose down
```

## Why it sometimes fails on Apple Silicon

- Some stacks (node-gyp, wkhtmltopdf, older binaries) don’t have ARM builds.
- Our `docker-compose.yml` pins **web** to `platform: linux/amd64` by default for maximum compatibility.
  If your app builds natively on arm64, remove that line for faster native performance.

## Common fixes

- **Daemon not running**: `docker info` fails → start Docker Desktop (macOS) or `sudo systemctl start docker` (Linux).
- **Permission denied on Linux**: add your user to the `docker` group and re-login.
- **Port not responding**: services may still be starting; see `docker compose ps` and `docker compose logs -f`.

## Service Map

- **web** → dev app server on `http://localhost:3000` (health endpoint optional)
- **db**  → Postgres 16 (port 5432, volume `pgdata`)
- **cache** → Redis 7 (port 6379)

## Switching away from amd64 emulation (faster, if supported)

1. Edit `docker-compose.yml`, remove `platform: linux/amd64` under `web`.
2. Rebuild clean:
   ```bash
   docker compose down --remove-orphans
   docker system prune -af
   docker compose build --no-cache
   docker compose up -d
   ```
3. If native build fails, revert the platform line and ensure Docker Desktop’s x86 emulation is enabled.

## Resetting a wedged DB

```bash
docker compose down -v
docker volume ls | grep pgdata
# If needed: docker volume rm <volume-name>
docker compose up -d
```

## Verification

```bash
chmod +x start-dev.sh test-setup.sh
./start-dev.sh | tee start-dev.out
./test-setup.sh | tee test-setup.out
docker compose ps | tee compose-ps.out
```
