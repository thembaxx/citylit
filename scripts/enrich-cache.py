"""Build app data from cached crawl results and batch Commons metadata."""
import json,pathlib,urllib.request,urllib.parse,re,html,datetime,time,io
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent.parent;OUT=ROOT/'public/data';IMG=ROOT/'public/images';DATE=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
def clean(s):return html.unescape(re.sub('<[^>]*>','',s or '')).strip()
r=json.load(open(OUT/'crawl-report.json'));batch=json.load(open(OUT/'commons-batch.json'));records={}
for p in batch.get('query',{}).get('pages',{}).values():
 if not p.get('imageinfo'):continue
 i=p['imageinfo'][0];m=i.get('extmetadata',{});license=clean(m.get('LicenseShortName',{}).get('value',''))
 if not any(s in license.lower() for s in ['cc by','cc0','public domain']):continue
 name=p['title'].removeprefix('File:');records[name.replace('_',' ') ]={'remote':i.get('thumburl',i['url']),'alt':clean(m.get('ImageDescription',{}).get('value',''))[:180] or name,'author':clean(m.get('Artist',{}).get('value',''))[:200],'license':license,'licenseUrl':m.get('LicenseUrl',{}).get('value',''),'sourceUrl':i['descriptionurl'],'filename':name}
cache={};rate_limited=False
def photo(name):
 global rate_limited
 name=name.replace('_',' ')
 if name in cache:return cache[name]
 item=records.get(name)
 if not item or rate_limited:return None
 import hashlib
 filename=hashlib.sha256(name.encode()).hexdigest()[:12]+'.jpg';dest=IMG/filename
 try:
  if not dest.exists():
   time.sleep(.6)
   request=urllib.request.Request(item['remote'],headers={'User-Agent':'Citylit/1.0 open-source South African discovery atlas'})
   raw=urllib.request.urlopen(request,timeout=25).read();im=Image.open(io.BytesIO(raw)).convert('RGB');im.thumbnail((1200,1200));im.save(dest,quality=83,optimize=True)
  result={k:v for k,v in item.items() if k!='remote'};result['src']='/images/'+filename;cache[name]=result;print('Photo saved:',name,flush=True);return result
 except Exception as e:
  if getattr(e,'code',None)==429:rate_limited=True
  print('Photo unavailable:',name,str(e)[:100],flush=True);cache[name]=None;return None
pages=r['wikipedia']
def images(page,limit=2):
 names=[page.get('pageimage','')]+[x['title'].removeprefix('File:') for x in page.get('images',[])]
 output=[]
 for name in dict.fromkeys(names):
  if not name:continue
  im=photo(name)
  if im and not any(x["src"]==im["src"] for x in output):output.append(im)
  if len(output)>=limit:break
 return output
previous_city_images=json.load(open(OUT/'city-images.json'))
city_images={}
for name,slug in [('Johannesburg','johannesburg'),('Cape Town','cape-town'),('Durban','durban')]:city_images[slug]=list({i['src']:i for i in images(pages.get(name,{}),3)+previous_city_images.get(slug,[])}.values())[:5]
places=json.load(open(OUT/'places.json'));catalog=json.load(open(ROOT/'scripts/catalog.json'))
for row,seed in zip(places,catalog):
 row.update({k:seed[k] for k in ['website','address','description']});row['checkedAt']=DATE;source=next((s for s in r['official'] if s['url']==seed['website']),None)
 if source:row['sources'][0]={k:source[k] for k in ['url','title','fetchedAt','status']}
 p=pages.get(seed.get('wiki'),{});coords=p.get('coordinates',[None])[0]
 if coords:row['coords']=[coords['lon'],coords['lat']];row['coordinateAccuracy']='venue';row['coordinateSource']='https://en.wikipedia.org/wiki/'+urllib.parse.quote(p['title'].replace(' ','_'))
 if p.get('title') and 'missing' not in p:
  row['wikipedia']='https://en.wikipedia.org/wiki/'+urllib.parse.quote(p['title'].replace(' ','_'))
  if not any(s['url']==row['wikipedia'] for s in row['sources']):row['sources'].append({'url':row['wikipedia'],'title':p['title'],'fetchedAt':DATE,'status':'fetched'})
 own=images(p,3)
 if own:
  prior=row['images'] if row['imageContext']=='venue' else []
  row['images']=list({i['src']:i for i in own+prior}.values())[:6];row['imageContext']='venue'
 elif row['imageContext']!='venue':row['images']=city_images[row['city']];row['imageContext']='city'
 if row['name']=='The Silo Hotel':row['website']='https://www.theroyalportfolio.com/the-silo-hotel/';row['sources'][0]['url']=row['website'];row['sources'][0]['status']='search-verified'
 if row['name']=='Elizabeth Sneddon Theatre':row['address']='UKZN Howard College Campus, Mazisi Kunene Road, Glenwood';row['sources'].append({'url':'https://www.sneddontheatre.co.za/contact-us/contact-us.html','title':'Elizabeth Sneddon Theatre contact','fetchedAt':DATE,'status':'search-verified'})
 if row['name']=='Cubaña Durban':row['sources'].append({'url':'https://cubana.co.za/pages/contact/','title':'Cubaña contact','fetchedAt':DATE,'status':'search-verified'})
 # Exterior of the same silo structure, sourced from the museum article.
 if row['name']=='The Silo Hotel':
  z=next(p for p in places if p['name']=='Zeitz MOCAA')
  if z['images'] and z['imageContext']=='venue':row['images']=z['images'];row['imageContext']='venue';row['coords']=z['coords'];row['coordinateAccuracy']='venue';row['coordinateSource']=z['coordinateSource']
 row['sources']=list({source['url']:source for source in row['sources']}.values())
 print(row['name'],row['coordinateAccuracy'],len(row['images']),flush=True)
json.dump(places,open(OUT/'places.json','w'),ensure_ascii=False,indent=2)
landmark_titles=['Ponte City Apartments','Nelson Mandela Bridge','Orlando Power Station','Table Mountain','Bo-Kaap','Cape Point','Moses Mabhida Stadium','UShaka Marine World','Umhlanga Lighthouse']
landmarks=json.load(open(OUT/'landmarks.json'))
for row,title in zip(landmarks,landmark_titles):
 p=pages.get(title,{});row['wikipedia']='https://en.wikipedia.org/wiki/'+urllib.parse.quote(p.get('title',title).replace(' ','_'));row['images']=images(p,2)
landmarks[-1]['wikipedia']='https://en.wikipedia.org/wiki/Umhlanga,_KwaZulu-Natal'
json.dump(landmarks,open(OUT/'landmarks.json','w'),ensure_ascii=False,indent=2);json.dump(city_images,open(OUT/'city-images.json','w'),ensure_ascii=False,indent=2)
credits=list({i['src']:i for p in places for i in p['images']}.values());credits+=list({i['src']:i for p in landmarks for i in p['images'] if i['src'] not in {x['src'] for x in credits}}.values());json.dump(credits,open(OUT/'image-credits.json','w'),ensure_ascii=False,indent=2)
print('Enrichment complete:',len(credits),'credited images')
