from django.core.management.base import BaseCommand
from django.conf import settings
from store.models import NewsletterSubscriber
from pathlib import Path
from datetime import datetime
import csv


class Command(BaseCommand):
    help = 'Export newsletter subscribers to a CSV file.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            help='Output CSV file path. Defaults to BASE_DIR/exports/newsletter_subscribers_<timestamp>.csv'
        )
        parser.add_argument(
            '--fields',
            type=str,
            default='email,name,country,is_verified,created_at',
            help='Comma-separated list of fields to export.'
        )

    def handle(self, *args, **options):
        fields = [f.strip() for f in options['fields'].split(',') if f.strip()]

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        default_dir = Path(settings.BASE_DIR) / 'exports'
        default_dir.mkdir(parents=True, exist_ok=True)

        output_path = Path(options['output']) if options.get('output') else default_dir / f'newsletter_subscribers_{timestamp}.csv'

        qs = NewsletterSubscriber.objects.all().order_by('created_at')

        with output_path.open('w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(fields)
            for sub in qs:
                row = []
                for field in fields:
                    val = getattr(sub, field, '')
                    if hasattr(val, 'isoformat'):
                        val = val.isoformat()
                    row.append(val)
                writer.writerow(row)

        self.stdout.write(self.style.SUCCESS(f'Exported {qs.count()} subscribers to {output_path}'))
