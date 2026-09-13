SHELL := /bin/bash
COMPOSE := docker compose
PORT := $(shell grep -E '^HTTP_PORT=' .env 2>/dev/null | cut -d= -f2)
PORT := $(if $(PORT),$(PORT),8080)

.DEFAULT_GOAL := help

.PHONY: help run stop restart logs ps build sync shell-db shell-api clean fclean re dev dev-api dev-web install

help: ## Show this help
	@echo ""
	@echo "  GaspardTourdiat.fr"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""

run: ## Build and start the whole stack (nginx + api + mariadb)
	@test -f .env || (cp .env.example .env && echo "→ Created .env from .env.example — edit it before exposing this to the internet.")
	$(COMPOSE) up --build -d
	@echo ""
	@echo "  → http://localhost:$(PORT)"
	@echo "  → http://localhost:$(PORT)/admin  (administration panel)"
	@echo ""

stop: ## Stop the stack
	$(COMPOSE) down

restart: ## Restart the stack
	$(COMPOSE) restart

logs: ## Follow the logs of every service
	$(COMPOSE) logs -f --tail=100

ps: ## Show the status of every service
	$(COMPOSE) ps

build: ## Rebuild the images without starting them
	$(COMPOSE) build --no-cache

sync: ## Force a GitHub re-sync of the projects
	$(COMPOSE) exec api node -e "import('./dist/projects.js').then(m => m.syncProjects()).then(r => console.log(r)).then(() => process.exit(0))"

clean: ## Remove containers and dangling images (keeps the database volume)
	$(COMPOSE) down --remove-orphans
	docker image prune -f

fclean: ## Remove containers, images AND the database volume
	$(COMPOSE) down --remove-orphans --volumes
	docker image prune -f

re: fclean run ## Full rebuild from scratch

## --- Local development (requires node + npm on the host) -------------------

install: ## Install frontend and backend dependencies
	cd backend && npm install
	cd frontend && npm install

dev-api: ## Run the API locally on :3000 (needs a reachable database)
	cd backend && npm run dev

dev-web: ## Run the Vite dev server locally on :5173
	cd frontend && npm run dev

dev: ## Print how to run both dev servers
	@echo "Run 'make dev-api' and 'make dev-web' in two terminals."
