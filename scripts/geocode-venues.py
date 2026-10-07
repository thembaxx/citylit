"""Resolve missing venue pins, respecting Nominatim's one-request-per-second policy.
Accept only matching venue names and nearby coordinates, never street/city results.
"""
import json,pathlib,urllib.request,urllib.parse,time,re,unicodedata,math
ROOT=pathlib.Path(__file__).resolve().parent.parent;p=ROOT/'public/data/places.json';rows=json.load(open(p));cities={'johannesburg':'Johannesburg','cape-town':'Cape Town','durban':'Durban'}
def tokens(s):return {x for x in re.sub(r'[^a-z0-9 ]',' ',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).split() if x not in {'the','of','national','city','and','centre','center'}}
for row in rows:
 if row['coordinateAccuracy']=='venue':continue
 name='Origin' if row['id']=='origin' else row['name'];url='https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode({'q':name+' '+cities[row['city']],'format':'json','limit':3,'namedetails':1,'countrycodes':'za'})
 time.sleep(1.2)
 try:
  response=json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Citylit/1.0 (github.com/thembaxx/citylit) source verification'}),timeout=20))
  for match in response:
   found=' '.join(match.get('namedetails',{}).values()) or match.get('name','');required=tokens(name)
   if not required.issubset(tokens(found)):continue
   if match.get('addresstype') in ['road','city','suburb','state','town','village']:continue
   lat=float(match['lat']);lon=float(match['lon']);old=row['coords'];distance=math.hypot((lon-old[0])*.87,lat-old[1])*111
   if distance>70:continue
   row['coords']=[lon,lat];row['coordinateAccuracy']='venue';row['coordinateSource']='https://www.openstreetmap.org/'+match['osm_type']+'/'+str(match['osm_id']);print('Matched',row['name'],found,flush=True);break
  else:print('No exact match',row['name'],flush=True)
 except Exception as e:
  print('Unavailable',row['name'],str(e),flush=True)
  if getattr(e,'code',None)==429:break
json.dump(rows,open(p,'w'),ensure_ascii=False,indent=2)
