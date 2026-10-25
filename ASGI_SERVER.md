# ASGI Server Configuration

**Current ASGI Server:** Daphne 4.2.3

## Development

Start the Django application with Daphne:

```bash
poetry run daphne config.asgi:application -b 127.0.0.1 -p 8000
```

Or use Django's development server (automatically uses ASGI):

```bash
poetry run python manage.py runserver
```

## Production

Run Daphne with appropriate settings:

```bash
poetry run daphne config.asgi:application \
  -b 0.0.0.0 \
  -p 8000 \
  --access-log /var/log/daphne-access.log \
  --proxy-headers
```

## Why Daphne?

- Official Django Channels ASGI server
- Built on Twisted (mature async framework)
- WebSocket support built-in
- Stable and production-ready
- Better Django integration than alternatives

## ASGI Application

Located in `config/asgi.py`:

```python
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_asgi_application()
```

Configured in `config/settings.py`:

```python
ASGI_APPLICATION = "config.asgi.application"
```

## Preserved Synchronous Components

The following remain synchronous (by design):

- **Order creation** — `transaction.atomic()` + `select_for_update()`
- **Inventory reservation** — Part of order transaction
- **DRF views** — DRF async support incomplete
- **Database queries** — `mysqlclient` is synchronous

See `docs/async-architecture.md` for full architecture details.
