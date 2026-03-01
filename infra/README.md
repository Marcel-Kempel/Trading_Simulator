# Infrastructure Quickstart (k3d + Helm + Argo CD)

## Why this setup
- Current repo stack is `Node backend + React/Vite frontend + MariaDB` (see `backend/package.json`, `frontend/package.json`, `docker-compose.yml`).
- This setup keeps DB flexible: deploy internal DB for local demo, or switch to external DB only by changing Helm values.

## Local tool choice
Use **k3d** (recommended for beginners):
- It runs Kubernetes inside Docker, so it is fast and light.
- Traefik is included by default in k3s/k3d (no extra ingress controller install needed).

## 1) Create local cluster
```bash
k3d cluster create trading \
  --agents 1 \
  -p "80:80@loadbalancer" \
  -p "443:443@loadbalancer"
```

Check:
```bash
kubectl get nodes
```
You should see one server and one agent as `Ready`.

## 2) Make host entry for ingress host
Add to `/etc/hosts`:
```txt
127.0.0.1 trading.localhost
```

Check:
```bash
ping -c 1 trading.localhost
```

## 3) Install chart with Helm (without Argo first)
```bash
kubectl create namespace trading
helm upgrade --install trading-simulator ./infra/helm/trading-simulator \
  -n trading \
  -f ./infra/helm/trading-simulator/values.yaml \
  -f ./infra/helm/trading-simulator/values-local.yaml
```

Check:
```bash
kubectl get pods -n trading
kubectl get ingress -n trading
```
Pods should become `Running`; ingress host should be `trading.localhost`.

## 4) Open app and API
- Frontend: `http://trading.localhost/`
- Backend health: `http://trading.localhost/api/db/health`

Check backend response:
```bash
curl http://trading.localhost/api/db/health
```
Expect JSON status `UP`.

## 5) Install Argo CD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Check:
```bash
kubectl get pods -n argocd
```
All Argo pods should be `Running`.

## 6) Let Argo CD manage the app
```bash
kubectl apply -f infra/argocd/trading-simulator-app.yaml
```

Check:
```bash
kubectl get applications -n argocd
```
App `trading-simulator` should become `Synced` and `Healthy`.

## Switch to external DB later
In Helm values:
- set `internalDatabase.enabled: false`
- set `database.host` to external DB host
- set credentials under `database.*`

No chart structure changes required.

## GHCR image pipeline
Workflow file: `.github/workflows/build-images.yml`
- Builds `frontend` and `backend` images on push to `main` or `Docker`.
- Pushes tags to GHCR.

## Team alignment questions
1. Which branch is deployment source (`main` or `Docker`) for Argo CD?
2. Final backend stack: keep Node backend or migrate to Spring Boot?
3. Final DB runtime: in-cluster MariaDB or external server DB?
4. Which hostnames/ports should be fixed for demo (frontend + API)?
5. Which env vars are mandatory for backend in every environment?
6. Who owns registry naming/tag strategy (`latest`, `sha`, release tags)?
7. Should Argo auto-sync stay enabled in demo (`prune/selfHeal`) or manual only?

## Glossary (short)
- Kubernetes: platform that runs containers reliably.
- Pod: smallest runnable unit (one app container, sometimes sidecars).
- Deployment: controller that keeps desired number of pods running.
- Service: stable internal network endpoint for pods.
- Ingress: HTTP routing from outside to services.
- Helm: templating/package manager for Kubernetes YAML.
- Argo CD: continuously applies Git state to Kubernetes.
- GitOps: Git is the source of truth for deployments.
- Registry: image storage (for example GHCR).
