from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
import requests
from store.models import ImageToolKit, VideoToolKit, ChatBotToolKit


class Command(BaseCommand):
    help = 'Populate toolkit models with initial data'

    def handle(self, *args, **options):
        # Image Toolkit Data
        image_toolkit_data = {
            'title': 'Image Generation Toolkit',
            'description': 'Complete prompt library for various art styles and compositions. Step-by-step workflows for character consistency. Lighting and mood control techniques. Advanced parameters and settings guide. Tips for refining and iterating on outputs. Real-world use cases and examples.',
            'price': 0.00,
            'image_url': 'https://rvosqmvsgmcuaujkphhr.supabase.co/storage/v1/object/public/SUITCASE/IMAGE%20SUITCASE/79eeff69-d4ff-4348-a66f-2ca38c1a88bc_4096x3058.png'
        }

        # Video Toolkit Data
        video_toolkit_data = {
            'title': 'Video Creation Toolkit',
            'description': 'Scene composition and camera movement prompts. Storyboarding techniques for AI video. Transition and pacing strategies. Character animation workflows. Audio-visual synchronization tips. Export settings and optimization guide.',
            'price': 0.00,
            'image_url': 'https://rvosqmvsgmcuaujkphhr.supabase.co/storage/v1/object/public/SUITCASE/VIDEO%20SUITCASE/93421556-a729-4468-b70d-b91742c681e0_4096x3058.png'
        }

        # Chatbot Toolkit Data
        chatbot_toolkit_data = {
            'title': 'Chatbot Mastery Toolkit',
            'description': 'System prompt templates for various use cases. Conversation flow design patterns. Tone and personality configuration. Context management strategies. Error handling and fallback responses. Integration and deployment guides.',
            'price': 0.00,
            'image_url': 'https://rvosqmvsgmcuaujkphhr.supabase.co/storage/v1/object/public/SUITCASE/CHATBOT%20SUITCASE/582a0261-c65f-4789-9d29-9d261aea7cca_4096x3058.png'
        }

        # Create or update Image Toolkit
        image_toolkit, created = ImageToolKit.objects.get_or_create(
            title=image_toolkit_data['title'],
            defaults={
                'description': image_toolkit_data['description'],
                'price': image_toolkit_data['price'],
                'image_url': image_toolkit_data['image_url'],
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Image Toolkit: {image_toolkit.title}'))
        else:
            self.stdout.write(self.style.WARNING(f'Image Toolkit already exists: {image_toolkit.title}'))

        # Create or update Video Toolkit
        video_toolkit, created = VideoToolKit.objects.get_or_create(
            title=video_toolkit_data['title'],
            defaults={
                'description': video_toolkit_data['description'],
                'price': video_toolkit_data['price'],
                'image_url': video_toolkit_data['image_url'],
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Video Toolkit: {video_toolkit.title}'))
        else:
            self.stdout.write(self.style.WARNING(f'Video Toolkit already exists: {video_toolkit.title}'))

        # Create or update Chatbot Toolkit
        chatbot_toolkit, created = ChatBotToolKit.objects.get_or_create(
            title=chatbot_toolkit_data['title'],
            defaults={
                'description': chatbot_toolkit_data['description'],
                'price': chatbot_toolkit_data['price'],
                'image_url': chatbot_toolkit_data['image_url'],
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Chatbot Toolkit: {chatbot_toolkit.title}'))
        else:
            self.stdout.write(self.style.WARNING(f'Chatbot Toolkit already exists: {chatbot_toolkit.title}'))

        self.stdout.write(self.style.SUCCESS('Successfully populated toolkits'))
