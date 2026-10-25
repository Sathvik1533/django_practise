from django.db import models
from django.db.models import Q


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=64, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sku} - {self.name}"


class Inventory(models.Model):
    product = models.OneToOneField(
        Product,
        on_delete=models.PROTECT,
        related_name="inventory",
    )
    quantity_on_hand = models.PositiveIntegerField(default=0)
    quantity_reserved = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity_reserved__lte=models.F("quantity_on_hand")),
                name="reserved_lte_on_hand",
            ),
        ]

    @property
    def available_quantity(self):
        return self.quantity_on_hand - self.quantity_reserved

    def __str__(self):
        return f"{self.product.sku}: {self.available_quantity} available"