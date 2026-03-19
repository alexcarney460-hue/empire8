
import os
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
Q = chr(39)
BT = chr(96)
DS = chr(36)

def w(rel, content):
    fp = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    c = content.replace("_Q_", Q).replace("_BT_", BT).replace("_DS_", DS)
    with open(fp, "w", newline=chr(10)) as f:
        f.write(c)
    print("Wrote:", fp)

print("Generator ready")
