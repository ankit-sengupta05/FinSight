# -*- coding: utf-8 -*-
# scripts/check_requirements.py
from pathlib import Path
import sys

req_file = Path('requirements.txt')
if req_file.exists():
    for i, line in enumerate(req_file.read_text().splitlines(), start=1):
        stripped = line.strip()
        if stripped and not stripped.startswith('#'):
            if '==' not in stripped and '>=' not in stripped:
                msg = 'Warning: line ' + str(i) + ' no version pin: ' + stripped
                sys.stdout.buffer.write(msg.encode('utf-8') + b'\n')
