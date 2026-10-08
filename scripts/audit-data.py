"""Check catalog integrity and write an editorial quality report without network calls."""
import json,pathlib,datetime,sys,collections,re
from safe_fetch import public_host
ROOT=pathlib.Path(__file__).resolve().parent.parent;rows=json.load(open(ROOT/'public/data/places.json'));cities=json.load(open(ROOT/'public/data/cities.json'));today=datetime.datetime.now(datetime.timezone.utc).date();errors=[];issues=[]
def check_url(value, context):
 if not value:return
 try:public_host(value)
 except (ValueError,UnicodeError):errors.append('Unsafe URL: '+context)
def check_photos(images, context):
 for image in images:
  if not re.fullmatch(r'/images/[a-f0-9]{12}\.jpg',image['src']):errors.append('Unsafe photo path: '+context);continue
  if not (ROOT/('public'+image['src'])).is_file():errors.append('Missing photo: '+image['src'])
  if not image['license'] or not image['sourceUrl']:errors.append('Missing credit: '+image['src'])
  for field in ('sourceUrl','licenseUrl'):check_url(image.get(field),context+'/'+field)
for filename in ('city-images.json','landmarks.json','image-credits.json'):
 data=json.load(open(ROOT/'public/data'/filename))
 if filename=='city-images.json':
  for city,images in data.items():check_photos(images,city)
 elif filename=='landmarks.json':
  for landmark in data:check_photos(landmark.get('images',[]),landmark['name']);check_url(landmark.get('wikipedia'),landmark['name'])
 else:check_photos(data,filename)
for city in cities:
 if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',city['slug']):errors.append('Unsafe city slug')
 for url in city.get('landmarkLinks',[]):check_url(url,city['slug'])
for event in json.load(open(ROOT/'public/data/events.json')):check_url(event.get('source'),event.get('id','event'))
seen=set();ids=set()
for row in rows:
 if row['id'] in ids:errors.append('Duplicate ID: '+row['id'])
 ids.add(row['id'])
 identity=(row['city'],row['name'].casefold())
 if identity in seen:errors.append('Duplicate venue: '+row['name'])
 seen.add(identity)
 if row['city'] not in {c['slug'] for c in cities}:errors.append('Unknown city: '+row['id'])
 if not (15<row['coords'][0]<34 and -36<row['coords'][1]<-21):errors.append('Out-of-bounds coordinates: '+row['id'])
 if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',row['id']):errors.append('Unsafe place ID')
 check_photos(row['images'],row['id'])
 for field in ('website','wikipedia','aboutSource','aboutLicense'):check_url(row.get(field),row['id']+'/'+field)
 for source in row['sources']:check_url(source['url'],row['id']+'/source')
 for key,fact in row.get('facts',{}).items():
  if str(fact.get('source','')).startswith(('http:', 'https:')):check_url(fact['source'],row['id']+'/'+key)
  if fact.get('confidence') not in ('verified','editorial-estimate','unknown') or not isinstance(fact.get('source'),str):errors.append('Invalid practical fact: '+row['id']+'/'+key)
  if fact.get('checkedAt') or fact.get('confidence')!='unknown':
   try:datetime.date.fromisoformat(fact['checkedAt'])
   except (ValueError,KeyError):errors.append('Invalid fact check date: '+row['id']+'/'+key)
  if fact.get('confidence')=='unknown' and fact.get('value') is not None:errors.append('Unknown fact has a value: '+row['id']+'/'+key)
 missing=[]
 if row['coordinateAccuracy']!='venue':missing.append('venue pin')
 if row.get('coordinateRole')!='entrance':missing.append('entrance verification')
 if row['imageContext']!='venue':missing.append('venue photographs')
 if any(s['status']=='unavailable' for s in row['sources']):missing.append('source fetch')
 if (today-datetime.date.fromisoformat(row['checkedAt'])).days>30 or any(f['confidence']=='verified' and f.get('checkedAt') and (today-datetime.date.fromisoformat(f['checkedAt'])).days>30 for f in row.get('facts',{}).values()):missing.append('stale practical facts')
 issues.append(dict(id=row['id'],needs=missing))
report=dict(generatedAt=today.isoformat(),places=len(rows),cities=len(cities),venuePins=sum(r['coordinateAccuracy']=='venue' for r in rows),images=len({i['src'] for r in rows for i in r['images']}),errors=errors,issues=issues)
json.dump(report,open(ROOT/'public/data/quality-report.json','w'),ensure_ascii=False,indent=2)
print(json.dumps({k:v for k,v in report.items() if k!='issues'},indent=2));sys.exit(bool(errors))
