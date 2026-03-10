# scripts/mask_keys.py
import re
import sys
from pathlib import Path

SECRET_PATTERNS = [
    r'(FIREBASE_API_KEY'
    r'|FIREBASE_AUTH_DOMAIN'
    r'|FIREBASE_PROJECT_ID'
    r'|FIREBASE_STORAGE_BUCKET'
    r'|FIREBASE_MESSAGING_SENDER_ID'
    r'|FIREBASE_APP_ID'
    r'|API_KEY|_SECRET|_TOKEN'
    r'|PASSWORD|PRIVATE_KEY)'
    r'=[^\s\n"\']+',
]

masked_files = []
files_to_scan = sys.argv[1:] if len(sys.argv) > 1 else []

for file_str in files_to_scan:
    file_path = Path(file_str)
    if not file_path.is_file():
        continue
    try:
        content = file_path.read_text(errors='ignore')
    except Exception:
        continue
    original = content
    for pattern in SECRET_PATTERNS:
        content = re.sub(
            pattern,
            lambda m: m.group(0).split('=')[0] + '=******',
            content,
        )
    if content != original:
        file_path.write_text(content)
        masked_files.append(str(file_path))

if masked_files:
    msg = '[MASKED] Secrets found in: ' + ', '.join(masked_files)
    sys.stdout.buffer.write(msg.encode('utf-8') + b'\n')
    sys.exit(1)
else:
    sys.stdout.buffer.write(b'[OK] No secrets found.\n')
    sys.exit(0)
