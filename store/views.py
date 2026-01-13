from django.shortcuts import render
from django.http import JsonResponse, FileResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.contrib.admin.views.decorators import staff_member_required
import csv
from datetime import datetime
from .models import ImageToolKit, VideoToolKit, ChatBotToolKit, NewsletterSubscriber
import stripe
from django.core.files.storage import default_storage
import json

# Set Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY

# Create your views here.
def index(request):
    return render(request, 'index.html')

def chattoolkit(request):
    try:
        toolkit = ChatBotToolKit.objects.first()
    except ChatBotToolKit.DoesNotExist:
        toolkit = None
    
    # Check if user is returning from successful checkout
    session_id = request.GET.get('session_id')
    download_available = False
    
    if session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            # Verify payment was successful
            if session.payment_status == 'paid':
                download_available = True
        except stripe.error.StripeError:
            pass
    
    context = {
        'toolkit': toolkit,
        'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
        'session_id': session_id,
        'download_available': download_available,
    }
    return render(request, 'chatbot-toolkit.html', context)  

def imagetoolkit(request):
    try:
        toolkit = ImageToolKit.objects.first()
    except ImageToolKit.DoesNotExist:
        toolkit = None
    
    # Check if user is returning from successful checkout
    session_id = request.GET.get('session_id')
    download_available = False
    
    if session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            # Verify payment was successful
            if session.payment_status == 'paid':
                download_available = True
        except stripe.error.StripeError:
            pass
    
    context = {
        'toolkit': toolkit,
        'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
        'session_id': session_id,
        'download_available': download_available,
    }
    return render(request, 'image-toolkit.html', context)

def videotoolkit(request):
    try:
        toolkit = VideoToolKit.objects.first()
    except VideoToolKit.DoesNotExist:
        toolkit = None
    
    # Check if user is returning from successful checkout
    session_id = request.GET.get('session_id')
    download_available = False
    
    if session_id:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            # Verify payment was successful
            if session.payment_status == 'paid':
                download_available = True
        except stripe.error.StripeError:
            pass
    
    context = {
        'toolkit': toolkit,
        'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
        'session_id': session_id,
        'download_available': download_available,
    }
    return render(request, 'video-toolkit.html', context)


@require_http_methods(["POST"])
@csrf_exempt
def create_checkout_session(request):
    """Create a Stripe checkout session"""
    try:
        import json
        data = json.loads(request.body)
        toolkit_type = data.get('toolkit_type')
        newsletter_email = data.get('newsletter_email', '').strip()

        # Enforce newsletter verification before checkout
        if not newsletter_email:
            return JsonResponse({'error': 'Please join the newsletter before checkout.'}, status=400)

        subscriber = NewsletterSubscriber.objects.filter(email__iexact=newsletter_email).first()
        if not subscriber:
            return JsonResponse({'error': 'Please sign up for the newsletter to continue.'}, status=400)

        if not subscriber.is_verified:
            return JsonResponse({'error': 'Please verify your newsletter email (check your 4-digit code) before checkout.'}, status=400)
        
        # Get the toolkit based on type
        if toolkit_type == 'image':
            toolkit = ImageToolKit.objects.first()
        elif toolkit_type == 'video':
            toolkit = VideoToolKit.objects.first()
        elif toolkit_type == 'chat':
            toolkit = ChatBotToolKit.objects.first()
        else:
            return JsonResponse({'error': 'Invalid toolkit type'}, status=400)
        
        if not toolkit:
            return JsonResponse({'error': 'Toolkit not found'}, status=404)
        
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': toolkit.title,
                            'description': toolkit.description[:500],  # Stripe limit
                            'images': [toolkit.image_url] if toolkit.image_url else [],
                        },
                        'unit_amount': int(float(toolkit.price) * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }
            ],
            mode='payment',
            success_url=request.build_absolute_uri('/') + f'{toolkit_type}-toolkit/?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=request.build_absolute_uri('/') + f'{toolkit_type}-toolkit/',
        )
        
        return JsonResponse({'sessionId': session.id})
    except stripe.error.StripeError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
def download_toolkit(request, toolkit_type):
    """Download toolkit file after successful payment verification"""
    try:
        session_id = request.GET.get('session_id')
        
        if not session_id:
            return JsonResponse({'error': 'No session ID provided'}, status=400)
        
        # Verify the Stripe session to confirm payment was successful
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status != 'paid':
            return JsonResponse({'error': 'Payment not completed'}, status=403)
        
        # Get the toolkit based on type
        if toolkit_type == 'image':
            toolkit = ImageToolKit.objects.first()
        elif toolkit_type == 'video':
            toolkit = VideoToolKit.objects.first()
        elif toolkit_type == 'chat':
            toolkit = ChatBotToolKit.objects.first()
        else:
            return JsonResponse({'error': 'Invalid toolkit type'}, status=400)
        
        if not toolkit or not toolkit.file:
            return JsonResponse({'error': 'Toolkit file not found'}, status=404)
        
        # Serve the file
        file_path = toolkit.file.name
        file_handle = default_storage.open(file_path, 'rb')
        
        response = FileResponse(file_handle, as_attachment=True)
        response['Content-Disposition'] = f'attachment; filename="{toolkit.title}.zip"'
        response['Content-Type'] = 'application/octet-stream'
        
        return response
        
    except stripe.error.InvalidRequestError:
        return JsonResponse({'error': 'Invalid session ID'}, status=400)
    except stripe.error.StripeError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    

def newsletter_signup(request):
    return render(request, "news-letter.html")


@require_http_methods(["POST"])
@csrf_exempt
def api_newsletter_signup(request):
    """Handle newsletter signup - save subscriber and send OTP via email"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        name = data.get('name', '').strip()
        country = data.get('country', '').strip()
        
        # Validation
        if not email or not name or not country:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Check if email already exists
        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={'name': name, 'country': country}
        )
        
        # Update name and country if subscriber already exists
        if not created:
            subscriber.name = name
            subscriber.country = country
        
        # Generate and save OTP
        otp = subscriber.generate_otp()
        subscriber.save()
        
        # Prepare HTML email from template
        otp_digits = list(otp)
        html_content = render_to_string(
            'email-otp-template.html',
            {
                'OTP_CODE': otp,
                'OTP_EXPIRY_MINUTES': 10,
                'D1': otp_digits[0] if len(otp_digits) > 0 else '',
                'D2': otp_digits[1] if len(otp_digits) > 1 else '',
                'D3': otp_digits[2] if len(otp_digits) > 2 else '',
                'D4': otp_digits[3] if len(otp_digits) > 3 else '',
                'SUPPORT_EMAIL': 'support@creatorpromptshop.com',
                'YEAR': 2026,
                'NAME': name,
                'EMAIL': email,
            }
        )
        # Plaintext fallback
        text_content = strip_tags(html_content)

        # Send OTP email (HTML + plaintext)
        send_mail(
            subject='Creator Prompt Shop - Email Verification',
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
            html_message=html_content,
        )
        
        return JsonResponse({'success': True, 'message': 'OTP sent to your email'})
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def api_newsletter_verify_otp(request):
    """Verify OTP and mark subscriber as verified"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        otp = data.get('otp', '').strip()
        
        # Validation
        if not email or not otp:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Find subscriber
        try:
            subscriber = NewsletterSubscriber.objects.get(email=email)
        except NewsletterSubscriber.DoesNotExist:
            return JsonResponse({'error': 'Subscriber not found'}, status=404)
        
        # Check OTP expiry
        if not subscriber.otp or not subscriber.otp_expires_at or subscriber.otp_expires_at < timezone.now():
            # Clear expired OTP to prevent reuse
            subscriber.otp = ''
            subscriber.otp_expires_at = None
            subscriber.save(update_fields=['otp', 'otp_expires_at'])
            return JsonResponse({'error': 'OTP expired. Please request a new code.'}, status=400)

        # Verify OTP value
        if subscriber.otp != otp:
            return JsonResponse({'error': 'Invalid OTP'}, status=400)
        
        # Mark as verified
        subscriber.is_verified = True
        subscriber.otp = ''  # Clear OTP after verification
        subscriber.otp_expires_at = None
        subscriber.save(update_fields=['is_verified', 'otp', 'otp_expires_at'])
        
        # Send welcome message email
        try:
            welcome_html = render_to_string(
                'welcome-message.html',
                {
                    'NAME': subscriber.name,
                    'EMAIL': subscriber.email,
                    'SUPPORT_EMAIL': 'support@creatorpromptshop.com',
                    'YEAR': timezone.now().year,
                }
            )
            welcome_text = strip_tags(welcome_html)
            
            send_mail(
                subject='Welcome to Creator Prompt Shop Newsletter! 🎉',
                message=welcome_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,  # Don't fail the verification if email fails
                html_message=welcome_html,
            )
        except Exception as e:
            # Log error but don't fail the verification process
            print(f"Failed to send welcome email to {email}: {str(e)}")
        
        return JsonResponse({'success': True, 'message': 'Email verified successfully'})
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@staff_member_required
@require_http_methods(["GET"])
def export_newsletter_subscribers_csv(request):
    """Admin-only endpoint to download subscribers as CSV"""
    fields = ['email', 'name', 'country', 'is_verified', 'created_at']
    filename = f"newsletter_subscribers_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow(fields)

    qs = NewsletterSubscriber.objects.all().order_by('created_at')
    for sub in qs:
        writer.writerow([
            sub.email,
            sub.name,
            sub.country,
            sub.is_verified,
            sub.created_at.isoformat() if sub.created_at else '',
        ])

    return response