from rest_framework import serializers

from inventory.models import Product


class ProductCatalogueSerializer(serializers.ModelSerializer):
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "price", "available_quantity"]
