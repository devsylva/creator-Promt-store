from django.contrib import admin
from .models import ImageToolKit, VideoToolKit, ChatBotToolKit, NewsletterSubscriber

# Register your models here.
admin.site.register(ImageToolKit)
admin.site.register(VideoToolKit)
admin.site.register(ChatBotToolKit)


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'country', 'is_verified', 'created_at')
    list_filter = ('country', 'is_verified', 'created_at')
    search_fields = ('email', 'name', 'country')
    readonly_fields = ('created_at', 'updated_at', 'otp')
