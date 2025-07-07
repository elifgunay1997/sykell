# Sykell Web Crawler Dashboard - Makefile
# Easy commands for running, testing, and managing the application

.PHONY: help start stop test frontend-test backend-test clean logs

# Default target
help:
	@echo "Available commands:"
	@echo "  start          - Start the application (frontend + backend + database)"
	@echo "  stop           - Stop all services"
	@echo "  test           - Run all tests"
	@echo "  frontend-test  - Run frontend tests only"
	@echo "  backend-test   - Run backend tests only"
	@echo "  logs           - Show application logs"
	@echo "  clean          - Remove containers and volumes"

start:
	docker-compose up -d

stop:
	docker-compose down

test: frontend-test backend-test

frontend-test:
	cd frontend && npm test -- --watchAll=false

backend-test:
	cd backend && go test ./...

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans 