import os
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), chr(115)+chr(114)+chr(99))
def w(rel, content):
    fp = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, chr(119), newline=chr(10)) as f2:
        f2.write(content)
    print(chr(87)+chr(114)+chr(111)+chr(116)+chr(101)+chr(58), fp)
