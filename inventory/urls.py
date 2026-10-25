from django.urls import path

from inventory.views import ProductListView

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
]
