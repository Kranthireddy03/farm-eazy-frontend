from pathlib import Path
from collections import deque
path = Path('src/pages/Login.jsx')
lines = path.read_text(encoding='utf-8').splitlines()
start = 463
end = 885
stack = deque()
for idx, line in enumerate(lines[start:end], start+1):
    stripped = line.strip()
    if stripped == '<>':
        stack.append(idx)
    elif stripped == '</>':
        if not stack:
            print('extra fragment close at', idx)
        else:
            stack.pop()
print('remaining fragments', len(stack))
for ln in stack:
    print('fragment open at', ln)
