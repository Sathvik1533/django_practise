from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.serializers import OrderCreateSerializer
from orders.services import create_order, OrderCreationError


class OrderCreateView(APIView):
    """
    API endpoint for creating orders.
    
    Validates request structure, calls the service layer to create an order,
    and returns order details or appropriate error responses.
    """
    
    def post(self, request):
        # Step 1: Validate request structure with serializer
        serializer = OrderCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Step 2: Call service to create order (handles business logic)
        try:
            order = create_order(serializer.validated_data["items"])
        except OrderCreationError as e:
            # Business rule violation (e.g., insufficient stock, inactive product)
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Step 3: Build response with order details
        items_data = []
        order_total = 0
        
        for item in order.items.all():
            line_total = item.line_total
            order_total += line_total
            
            items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "line_total": str(line_total),
            })
        
        response_data = {
            "order_id": order.id,
            "status": order.status,
            "items": items_data,
            "total": str(order_total),
            "created_at": order.created_at.isoformat(),
        }
        
        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )
