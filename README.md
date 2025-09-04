# Knovator Project - Docker & GitLab CI/CD Setup

This repository contains the **Knovator project** with `barnbook_api` backend and `Frontend` React application. It demonstrates **Docker-based deployment** and **GitLab CI/CD pipeline setup** with a GitLab Runner on an Ubuntu server.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Docker Setup](#docker-setup)
4. [Building and Running Containers](#building-and-running-containers)
5. [GitLab Runner Setup](#gitlab-runner-setup)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Common Commands](#common-commands)

---

## Prerequisites

* Ubuntu Server
* `sudo` privileges
* Git installed
* Internet connectivity

---

## Project Structure

```text
.
├── Frontend
│   └── Dockerfile
├── barnbook_api
│   ├── Dockerfile
│   ├── docker-compose.yaml
│   └── .env
└── .gitlab-ci.yml
```

---

## Docker Setup

1. **Install dependencies**

```bash
sudo apt update
sudo apt-get install ca-certificates curl gnupg lsb-release -y
sudo mkdir -p /etc/apt/keyrings
```

2. **Add Docker repository**

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

3. **Install Docker & Docker Compose**

```bash
sudo apt-get install docker.io -y
sudo apt-get install docker-compose-plugin -y
docker compose version
```

4. **Permissions**

```bash
sudo chown $USER:$USER /var/run/docker.sock
```

---

## Building and Running Containers

1. **Navigate to the project**

```bash
cd knovator/barnbook_api
```

2. **Create `.env` file**

```bash
vi .env
# Add environment variables like BASE_URL, DB_HOST, DB_NAME, etc.
```

3. **Build Docker images**

```bash
docker build -t node_api .      # Backend
cd ../Frontend
docker build -t react_frontend . # Frontend
```
4. **Run & Test using docker then apply docker compose**

```bash
docker run -d  node_api:latest      # Backend
cd ../Frontend
docker run -dreact_frontend:latest . # Frontend
```

5. **Run containers using compose**

```bash
docker compose up -d
docker ps
docker logs <container_id> -f
```

6. **Stop and cleanup containers**

```bash
docker compose down
docker system prune --all
docker volume ls
docker volume rm <volume_name>
```

---

## GitLab Runner Setup

1. **Install GitLab Runner**

```bash
sudo curl -L --output /usr/local/bin/gitlab-runner https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64
sudo chmod +x /usr/local/bin/gitlab-runner
sudo useradd --comment 'GitLab Runner' --create-home gitlab-runner --docker /bin/bash
```

2. **Install systemd service**

```bash
sudo /usr/local/bin/gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner
sudo systemctl enable gitlab-runner
sudo systemctl start gitlab-runner
sudo systemctl status gitlab-runner
```

3. **Register Runner**

```bash
sudo gitlab-runner register \
  --url https://gitlab.com/ \
  --registration-token <YOUR_REGISTRATION_TOKEN> \
  --executor docker \
  --description "VM runner" \
  --tag-list "knovator-runner" \
  --non-interactive
```

4. **Restart and verify**

```bash
sudo systemctl restart gitlab-runner
sudo gitlab-runner list
sudo gitlab-runner verify
```

---

## CI/CD Pipeline (`.gitlab-ci.yml`)

**Stages:**

* `build` → Build and push Docker images to Docker Hub
* `deploy` → Pull images and run containers on server
* `cleanup` → Prune unused Docker images

**Key points:**

* `.env` is generated dynamically in CI
* Docker images pushed using `DOCKER_USERNAME` & `DOCKER_PASSWORD` variables
* Uses multi-stage deployment
* `docker compose down` used before deploying new containers

---

## Common Commands

* Check running containers:

```bash
docker ps
docker ps -a
```

* Check images:

```bash
docker images
```

* Remove dangling images:

```bash
docker system prune --all
```

* Remove volumes:

```bash
docker volume ls
docker volume rm <volume_name>
```

* View logs:

```bash
docker logs <container_id> -f
```

* Git commands for project:

```bash
git add .
git commit -m "message"
git push origin main
```

---

## Notes

* Make sure `.env` is present for `docker compose` to work.
* Use `sudo` if running Docker commands on the server requires root.
* The GitLab Runner must have permission to access Docker (`/var/run/docker.sock`).
* Clean up old containers and volumes to avoid conflicts when redeploying.

