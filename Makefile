# Surgiform Project Makefile
# 백엔드와 프론트엔드를 통합 관리

.PHONY: help install-backend install-frontend start-backend start-frontend start-all stop-all clean test format lint

# 기본 타겟
help: ## 사용 가능한 명령어 목록 표시
	@echo "Surgiform Project Management"
	@echo "=========================="
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# 설치 명령어
install-backend: ## 백엔드 의존성 설치 (Poetry)
	@echo "Installing backend dependencies..."
	cd surgiform-backend && poetry install
	@echo "Backend dependencies installed successfully!"

install-frontend: ## 프론트엔드 의존성 설치 (npm)
	@echo "Installing frontend dependencies..."
	cd surgiform-frontend && npm install
	@echo "Frontend dependencies installed successfully!"

install: install-backend install-frontend ## 모든 의존성 설치

# 환경 설정
setup-env: ## 환경변수 파일 설정
	@echo "Setting up environment files..."
	@if [ ! -f surgiform-backend/.env ]; then \
		echo "OPENAI_API_KEY=sk-test-key" > surgiform-backend/.env; \
		echo "Created surgiform-backend/.env"; \
	fi
	@if [ ! -f surgiform-frontend/.env.local ]; then \
		echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > surgiform-frontend/.env.local; \
		echo "Created surgiform-frontend/.env.local"; \
	fi
	@echo "Environment files configured!"

# 서버 시작 명령어
start-backend: ## 백엔드 서버 시작 (포트 8000)
	@echo "Starting backend server on port 8000..."
	cd surgiform-backend && poetry run uvicorn surgiform.deploy.server:app --reload --port 8000

start-frontend: ## 프론트엔드 서버 시작 (포트 3000)
	@echo "Starting frontend server on port 3000..."
	cd surgiform-frontend && npm run dev

start-all: ## 백엔드와 프론트엔드 동시 시작
	@echo "Starting both backend and frontend servers..."
	@echo "Backend will run on http://localhost:8000"
	@echo "Frontend will run on http://localhost:3000"
	@echo ""
	@echo "Starting backend in background..."
	cd surgiform-backend && poetry run uvicorn surgiform.deploy.server:app --reload --port 8000 &
	@echo "Waiting 3 seconds for backend to start..."
	@sleep 3
	@echo "Starting frontend..."
	cd surgiform-frontend && npm run dev

# 서버 중지 명령어
stop-backend: ## 백엔드 서버 중지
	@echo "Stopping backend server..."
	@pkill -f "uvicorn.*surgiform.deploy.server:app" || true
	@echo "Backend server stopped!"

stop-frontend: ## 프론트엔드 서버 중지
	@echo "Stopping frontend server..."
	@pkill -f "next.*dev" || true
	@echo "Frontend server stopped!"

stop-all: stop-backend stop-frontend ## 모든 서버 중지

# 포트 정리
clean-ports: ## 사용 중인 포트 정리
	@echo "Cleaning up ports 3000 and 8000..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@echo "Ports cleaned!"

# 테스트 명령어
test-backend: ## 백엔드 테스트 실행
	@echo "Running backend tests..."
	cd surgiform-backend && poetry run python -m pytest tests/ -v

test-frontend: ## 프론트엔드 테스트 실행
	@echo "Running frontend tests..."
	cd surgiform-frontend && npm test

test: test-backend test-frontend ## 모든 테스트 실행

# 코드 품질 관리
format-backend: ## 백엔드 코드 포맷팅
	@echo "Formatting backend code..."
	cd surgiform-backend && poetry run black surgiform/ tests/
	cd surgiform-backend && poetry run isort surgiform/ tests/

format-frontend: ## 프론트엔드 코드 포맷팅
	@echo "Formatting frontend code..."
	cd surgiform-frontend && npm run format

format: format-backend format-frontend ## 모든 코드 포맷팅

lint-backend: ## 백엔드 린팅
	@echo "Linting backend code..."
	cd surgiform-backend && poetry run flake8 surgiform/ tests/
	cd surgiform-backend && poetry run mypy surgiform/

lint-frontend: ## 프론트엔드 린팅
	@echo "Linting frontend code..."
	cd surgiform-frontend && npm run lint

lint: lint-backend lint-frontend ## 모든 린팅 실행

# 개발 도구
logs-backend: ## 백엔드 로그 확인
	@echo "Backend logs:"
	@tail -f surgiform-backend/logs/*.log 2>/dev/null || echo "No log files found"

logs-frontend: ## 프론트엔드 로그 확인
	@echo "Frontend logs (check terminal output)"

# 헬스 체크
health-check: ## 서버 상태 확인
	@echo "Checking server health..."
	@echo "Backend health:"
	@curl -s http://localhost:8000/health | jq . 2>/dev/null || echo "Backend not responding"
	@echo ""
	@echo "Frontend health:"
	@curl -s -I http://localhost:3000 | head -1 || echo "Frontend not responding"

# 정리 명령어
clean: ## 프로젝트 정리
	@echo "Cleaning project..."
	@rm -rf surgiform-backend/__pycache__
	@rm -rf surgiform-backend/surgiform/__pycache__
	@rm -rf surgiform-backend/surgiform/**/__pycache__
	@rm -rf surgiform-frontend/.next
	@rm -rf surgiform-frontend/node_modules/.cache
	@echo "Project cleaned!"

# 개발 환경 전체 설정
dev-setup: clean-ports setup-env install ## 개발 환경 전체 설정
	@echo "Development environment setup complete!"
	@echo "Run 'make start-all' to start both servers"

# 프로덕션 빌드
build-backend: ## 백엔드 빌드
	@echo "Building backend..."
	cd surgiform-backend && poetry build

build-frontend: ## 프론트엔드 빌드
	@echo "Building frontend..."
	cd surgiform-frontend && npm run build

build: build-backend build-frontend ## 모든 프로젝트 빌드

# Docker 관련 (선택사항)
docker-build: ## Docker 이미지 빌드
	@echo "Building Docker images..."
	docker-compose build

docker-up: ## Docker 컨테이너 시작
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down: ## Docker 컨테이너 중지
	@echo "Stopping Docker containers..."
	docker-compose down

# API 문서
docs: ## API 문서 생성
	@echo "Generating API documentation..."
	@echo "Backend API docs: http://localhost:8000/docs"
	@echo "Frontend API docs: Check frontend documentation"

# 데이터베이스 관련 (필요시)
db-migrate: ## 데이터베이스 마이그레이션
	@echo "Running database migrations..."
	cd surgiform-backend && poetry run alembic upgrade head

db-reset: ## 데이터베이스 초기화
	@echo "Resetting database..."
	cd surgiform-backend && poetry run alembic downgrade base
	cd surgiform-backend && poetry run alembic upgrade head

# 배포 관련
deploy-staging: ## 스테이징 환경 배포
	@echo "Deploying to staging..."
	cd surgiform-backend && ./deploy.sh surgiform-471510 asia-northeast1 --with-env api.surgi-form.com

deploy-prod: ## 프로덕션 환경 배포
	@echo "Deploying to production..."
	cd surgiform-backend && ./deploy.sh --prod surgiform-471510 asia-northeast1 --with-env api.surgi-form.com

# 기본값: 도움말 표시
.DEFAULT_GOAL := help
