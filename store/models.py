from django.db import models
import random
import string
from datetime import timedelta
from django.utils import timezone

# Create your models here.

class NewsletterSubscriber(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    country = models.CharField(max_length=100)
    otp = models.CharField(max_length=4, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email
    
    def generate_otp(self):
        """Generate a random 4-digit OTP"""
        self.otp = ''.join(random.choices(string.digits, k=4))
        self.otp_expires_at = timezone.now() + timedelta(minutes=10)
        return self.otp

class ImageToolKit(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    file = models.FileField(upload_to='image_toolkits/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class VideoToolKit(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    file = models.FileField(upload_to='video_toolkits/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class ChatBotToolKit(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    file = models.FileField(upload_to='chatbot_toolkits/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title