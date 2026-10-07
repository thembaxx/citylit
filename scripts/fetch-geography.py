"""Fetch South African province boundaries and simplify shared topology."""
import json,pathlib,urllib.request,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parent.parent;OUT=ROOT/'public/data'
meta=json.load(urllib.request.urlopen('https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/'))
with tempfile.TemporaryDirectory() as folder:
 source=pathlib.Path(folder)/'source.geojson';dest=pathlib.Path(folder)/'simplified.json'
 urllib.request.urlretrieve(meta['simplifiedGeometryGeoJSON'],source)
 subprocess.run(['pnpm','exec','mapshaper',str(source),'-simplify','10%','keep-shapes','-o','format=geojson',str(dest)],cwd=ROOT,check=True)
 data=json.load(open(dest));assert len(data['features'])==9
 for f in data['features']:f['properties']['shapeName']=f['properties']['shapeName'].replace('Nothern','Northern')
 json.dump(data,open(OUT/'provinces.json','w'),separators=(',',':'));json.dump(meta,open(OUT/'geography-source.json','w'),indent=2)
 print('Refreshed nine provinces. Source license:',meta['boundaryLicense'])
