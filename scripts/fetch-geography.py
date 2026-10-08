"""Fetch South African province boundaries and simplify shared topology."""
import json,pathlib,subprocess,tempfile
from safe_fetch import fetch_json, fetch_bytes, GEOGRAPHY_HOSTS
ROOT=pathlib.Path(__file__).resolve().parent.parent;OUT=ROOT/'public/data'
meta=fetch_json('https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/', allowed_hosts=GEOGRAPHY_HOSTS, max_bytes=1024*1024)
with tempfile.TemporaryDirectory() as folder:
 source=pathlib.Path(folder)/'source.geojson';dest=pathlib.Path(folder)/'simplified.json'
 source.write_bytes(fetch_bytes(meta['simplifiedGeometryGeoJSON'], allowed_hosts=GEOGRAPHY_HOSTS, max_bytes=16*1024*1024).body)
 subprocess.run(['pnpm','exec','mapshaper',str(source),'-simplify','10%','keep-shapes','-o','format=geojson',str(dest)],cwd=ROOT,check=True)
 data=json.load(open(dest))
 if len(data['features'])!=9:raise ValueError('Expected nine province features')
 for f in data['features']:f['properties']['shapeName']=f['properties']['shapeName'].replace('Nothern','Northern')
 json.dump(data,open(OUT/'provinces.json','w'),separators=(',',':'));json.dump(meta,open(OUT/'geography-source.json','w'),indent=2)
 print('Refreshed nine provinces. Source license:',meta['boundaryLicense'])
