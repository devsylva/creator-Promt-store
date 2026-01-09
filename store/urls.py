from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('chat-toolkit/', views.chattoolkit, name='chattoolkit'),
    path('image-toolkit/', views.imagetoolkit, name='imagetoolkit'),
    path('video-toolkit/', views.videotoolkit, name='videotoolkit'),
    path('api/checkout-session/', views.create_checkout_session, name='create_checkout_session'),
    path('download/<str:toolkit_type>/', views.download_toolkit, name='download_toolkit'),
    path('newsletter-signup/', views.newsletter_signup, name='newsletter_signup'),
    path('api/newsletter-signup/', views.api_newsletter_signup, name='api_newsletter_signup'),
    path('api/newsletter-verify-otp/', views.api_newsletter_verify_otp, name='api_newsletter_verify_otp'),
    path('export-newsletter-subscribers/', views.export_newsletter_subscribers_csv, name='export_newsletter_subscribers_csv'),
]