# chatbot/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("chat/", views.chat_interface, name="chat_interface"),
    path("api/chat/", views.chat_api, name="chat_api"),
    path('api/market_prices/', views.api_market_prices, name='api_market_prices'),
    path("api/market_raw/", views.raw_market_data, name="raw_market_data"),
]
