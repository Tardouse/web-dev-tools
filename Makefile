.PHONY: dev test check build install install-no-docker deploy deploy-native stop stop-native logs logs-native status-native

dev:
	npm run dev

test:
	npm test

check:
	npm run check

build:
	npm run build

install:
	./scripts/install-no-docker.sh

install-no-docker:
	./scripts/install-no-docker.sh

deploy:
	./scripts/deploy.sh

deploy-native:
	./scripts/install-no-docker.sh

stop:
	./scripts/stop.sh

stop-native:
	./scripts/native-service.sh stop

logs:
	docker compose logs -f --tail=100 web

logs-native:
	./scripts/native-service.sh logs

status-native:
	./scripts/native-service.sh status
