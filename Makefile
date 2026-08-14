.PHONY: dev test check build deploy stop logs

dev:
	npm run dev

test:
	npm test

check:
	npm run check

build:
	npm run build

deploy:
	./scripts/deploy.sh

stop:
	./scripts/stop.sh

logs:
	docker compose logs -f --tail=100 web
