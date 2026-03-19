import os

Q = chr(39)
BT = chr(96)

def w(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote {path}")

# We will read from separate data files
import sys
print("Generator ready")
