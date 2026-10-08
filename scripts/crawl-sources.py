"""Refresh Citylit data with bounded requests; reuse a seven-day cache.
No crawling occurs at app runtime. Wikimedia requests are batched and 429 stops
the refresh. Run with --force to fetch new data. Review changes before committing.
"""
import datetime,json,pathlib,urllib.request,urllib.parse,urllib.error,sys,re,html,subprocess
from concurrent.futures import ThreadPoolExecutor
ROOT=pathlib.Path(__file__).resolve().parent.parent;OUT=ROOT/'public/data';TODAY=datetime.datetime.now(datetime.timezone.utc).date();DATE=TODAY.isoformat();HEADERS={'User-Agent':'Citylit/1.0 (https://github.com/thembaxx/citylit) city discovery source refresh'}
def api(host,**params):
 url='https://'+host+'/w/api.php?'+urllib.parse.urlencode({'format':'json',**params})
 with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=25) as response:return json.load(response)
catalog=json.load(open(ROOT/'scripts/catalog.json'));report_path=OUT/'crawl-report.json';report=json.load(open(report_path)) if report_path.exists() else {'wikipedia':{},'official':[]}
if '--force' not in sys.argv and report.get('fetchedAt') and (TODAY-datetime.date.fromisoformat(report['fetchedAt'])).days<7:
 print('Source cache is current. Use --force to refresh.');sys.exit(0)
def official(row):
 result={'url':row['website'],'title':row['name'],'fetchedAt':DATE}
 try:
  with urllib.request.urlopen(urllib.request.Request(row['website'],headers=HEADERS),timeout=20) as response:
   text=response.read(1000000).decode('utf-8','replace');match=re.search(r'<title[^>]*>(.*?)</title>',text,re.S|re.I)
   if match:result['title']=html.unescape(re.sub('<[^>]*>','',match.group(1))).strip()[:180]
   result['status']='fetched';result['resolvedUrl']=response.url;result['httpStatus']=response.status
   description=re.search(r'<meta[^>]+name=[\"\']description[\"\'][^>]+content=[\"\']([^\"\']*)',text,re.I)
   if description:result['description']=html.unescape(description.group(1))[:300]
 except Exception as e:result.update(status='unavailable',error=str(e))
 return result
try:
 titles=list(dict.fromkeys([row['wiki'] for row in catalog if row.get('wiki')]+list(report['wikipedia'])))
 for start in range(0,len(titles),40):
  selected=titles[start:start+40];data=api('en.wikipedia.org',action='query',titles='|'.join(selected),redirects=1,prop='coordinates|pageimages|images',pithumbsize=1000,imlimit=10)['query'];pages={p['title']:p for p in data['pages'].values()};aliases={a['from']:a['to'] for a in data.get('normalized',[])+data.get('redirects',[])}
  for title in selected:
   if aliases.get(title,title) in pages:report['wikipedia'][title]=pages[aliases.get(title,title)]
 with ThreadPoolExecutor(max_workers=3) as pool:report['official']=list(pool.map(official,catalog))
 report['fetchedAt']=DATE;json.dump(report,open(report_path,'w'),ensure_ascii=False,indent=2)
 files=list(dict.fromkeys(['File:'+p['pageimage'] for p in report['wikipedia'].values() if p.get('pageimage')]+[i['title'] for p in report['wikipedia'].values() for i in p.get('images',[]) if re.search(r'\.(jpg|jpeg|png)$',i['title'],re.I)][:150]));meta={'query':{'pages':{}}}
 for start in range(0,len(files),40):
  data=api('commons.wikimedia.org',action='query',titles='|'.join(files[start:start+40]),prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=1000);meta['query']['pages'].update(data['query']['pages'])
 json.dump(meta,open(OUT/'commons-batch.json','w'),ensure_ascii=False,indent=2)
 subprocess.run([sys.executable,str(ROOT/'scripts/enrich-cache.py')],cwd=ROOT,check=True)
 print('Source refresh complete.')
except urllib.error.HTTPError as e:
 if e.code==429:print('Rate limit reached. Retained existing app data. Retry after the source Retry-After interval.');sys.exit(1)
 raise
