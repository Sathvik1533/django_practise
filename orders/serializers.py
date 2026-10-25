from rest_framework import serializers


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(
        many=True,
        allow_empty=False,
    )
    
    def validate_items(self, items):
        """Validate that no duplicate products exist in the order."""
        product_ids = [item["product_id"] for item in items]

        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError(
                "Each product can appear only once"
            )
        
        return items
