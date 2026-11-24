"""Run: python public/previews/home-wow/check.py"""
from html.parser import HTMLParser
from pathlib import Path
import subprocess
ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT.parents[1]
class Document(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=set(); self.fragments=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.add(a['id'])
        for key in ('src','href'):
            ref=a.get(key,'')
            if ref.startswith('#'):self.fragments.append(ref[1:])
            elif ref and not ref.startswith(('/', 'http:', 'https:', 'data:')):self.refs.append(ref.split('?')[0])
for file in ROOT.glob('*.html'):
    doc=Document();doc.feed(file.read_text())
    for ref in doc.refs:assert (ROOT/ref).exists(), (file.name,ref)
    for fragment in doc.fragments:assert fragment in doc.ids,(file.name,fragment)
    assert 'lang="ar"' in file.read_text()
for script in ROOT.glob('*.js'):
    subprocess.run(['node','--check',str(script)],check=True)
assert len(list(ROOT.glob('0*.html')))==7
assert (PUBLIC/'fonts/ibm-plex-arabic/regular.ttf').exists()
print('PASS: seven concepts, gallery, local assets, in-page anchors and JavaScript syntax.')
