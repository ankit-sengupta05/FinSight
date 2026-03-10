# -*- coding: utf-8 -*-
# scripts/compile_check.py
import subprocess
import sys
from pathlib import Path

SUPPORTED = {
    '.py': 'python',
    '.js': 'node',
    '.ts': 'typescript',
    '.jsx': 'node',
    '.tsx': 'typescript',
    '.java': 'java',
    '.kt': 'kotlin',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.dart': 'dart',
    '.swift': 'swift',
    '.c': 'c',
    '.cpp': 'cpp',
}

errors = []
files_to_scan = sys.argv[1:] if len(sys.argv) > 1 else []


def run(cmd, label, filepath):
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            out = (result.stderr or result.stdout).strip()
            errors.append('[' + label + '] ' + filepath + '\n  ' + out)
            return False
        return True
    except FileNotFoundError:
        return True
    except subprocess.TimeoutExpired:
        errors.append('[TIMEOUT] ' + filepath + ' took too long.')
        return False


for file_str in files_to_scan:
    fp = Path(file_str)
    if not fp.is_file():
        continue
    ext = fp.suffix.lower()
    lang = SUPPORTED.get(ext)
    if not lang:
        continue
    p = str(fp)

    if lang == 'python':
        run(['python', '-m', 'py_compile', p], 'Python', p)
    elif lang == 'node':
        run(['node', '--check', p], 'JavaScript', p)
    elif lang == 'typescript':
        run(
            ['npx', 'tsc', '--noEmit', '--allowJs', '--checkJs', p],
            'TypeScript',
            p,
        )
    elif lang == 'java':
        run(['javac', '-proc:none', p], 'Java', p)
    elif lang == 'kotlin':
        run(['kotlinc', '-script', p], 'Kotlin', p)
    elif lang == 'go':
        run(['go', 'vet', p], 'Go', p)
    elif lang == 'rust':
        run(
            ['rustc', '--edition', '2021', '--emit=metadata', '-o', 'nul', p],
            'Rust',
            p,
        )
    elif lang == 'ruby':
        run(['ruby', '-c', p], 'Ruby', p)
    elif lang == 'php':
        run(['php', '-l', p], 'PHP', p)
    elif lang == 'dart':
        run(['dart', 'analyze', p], 'Dart', p)
    elif lang == 'swift':
        run(['swiftc', '-parse', p], 'Swift', p)
    elif lang == 'c':
        run(['gcc', '-fsyntax-only', p], 'C', p)
    elif lang == 'cpp':
        run(['g++', '-fsyntax-only', p], 'C++', p)

if errors:
    sys.stdout.buffer.write(b'\n[COMPILE ERROR] Fix before committing:\n')
    sys.stdout.buffer.write(b'=' * 60 + b'\n')
    for err in errors:
        sys.stdout.buffer.write(err.encode('utf-8') + b'\n')
        sys.stdout.buffer.write(b'-' * 60 + b'\n')
    sys.exit(1)
else:
    sys.stdout.buffer.write(b'[OK] All files passed syntax check.\n')
    sys.exit(0)
