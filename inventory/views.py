from django.db.models import F
from rest_framework.generics import ListAPIView

from inventory.models import Product
from inventory.serializers import ProductCatalogueSerializer


class ProductListView(ListAPIView):
    serializer_class = ProductCatalogueSerializer

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True, inventory__isnull=False)
            .annotate(
                available_quantity=(
                    F("inventory__quantity_on_hand")
                    - F("inventory__quantity_reserved")
                )
            )
        )
