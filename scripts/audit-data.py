"""Check catalog integrity and write an editorial quality report without network calls."""
import json,pathlib,datetime,sys,collections
ROOT=pathlib.Path(__file__).resolve().parent.parent;rows=json.load(open(ROOT/'public/data/places.json'));cities=json.load(open(ROOT/'public/data/cities.json'));today=datetime.datetime.now(datetime.timezone.utc).date();errors=[];issues=[]
seen=set();ids=set()
for row in rows:
 if row['id'] in ids:errors.append('Duplicate ID: '+row['id'])
 ids.add(row['id'])
 identity=(row['city'],row['name'].casefold())
 if identity in seen:errors.append('Duplicate venue: '+row['name'])
 seen.add(identity)
 if row['city'] not in {c['slug'] for c in cities}:errors.append('Unknown city: '+row['id'])
 if not (15<row['coords'][0]<34 and -36<row['coords'][1]<-21):errors.append('Out-of-bounds coordinates: '+row['id'])
 for image in row['images']:
  if not (ROOT/('public'+image['src'])).exists():errors.append('Missing photo: '+image['src'])
  if not image['license'] or not image['sourceUrl']:errors.append('Missing credit: '+image['src'])
 for key,fact in row.get('facts',{}).items():
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
