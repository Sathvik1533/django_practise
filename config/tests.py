from django.test import TestCase
from django.test import AsyncClient
import asyncio


class HealthCheckTests(TestCase):
    """Tests for the async health check endpoint."""

    def test_health_check_returns_ok(self):
        """Test synchronous request to async health check endpoint."""
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_health_check_async(self):
        """Test async health check endpoint using AsyncClient."""
        async def run_async_test():
            client = AsyncClient()
            response = await client.get('/health/')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), {"status": "ok"})
        
        # Run the async test
        asyncio.run(run_async_test())
