from django.http import JsonResponse


async def health(request):
    """
    Async health check endpoint.
    
    Returns a simple JSON response indicating the service is running.
    This endpoint does not query the database or perform blocking I/O.
    """
    return JsonResponse({"status": "ok"})
