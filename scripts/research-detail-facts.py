"""Cache attributed Wikipedia introductions in bounded batches; retain data on failures."""
import json,pathlib,urllib.parse,datetime
from safe_fetch import fetch_json, WIKIMEDIA_HOSTS
ROOT=pathlib.Path(__file__).resolve().parent.parent;path=ROOT/'public/data/places.json';rows=json.load(open(path));titles=list(dict.fromkeys(urllib.parse.unquote(r['wikipedia'].split('/wiki/')[-1]).replace('_',' ') for r in rows if r.get('wikipedia')))
try:
 pages={};aliases={}
 for start in range(0,len(titles),20):
  url='https://en.wikipedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',format='json',titles='|'.join(titles[start:start+20]),prop='extracts',exlimit='max',exintro=1,explaintext=1,exsentences=4,redirects=1))
  query=fetch_json(url, allowed_hosts=WIKIMEDIA_HOSTS)['query'];pages.update({p['title']:p for p in query['pages'].values()});aliases.update({a['from']:a['to'] for a in query.get('normalized',[])+query.get('redirects',[])})
 for row in rows:
  if not row.get('wikipedia'):continue
  title=urllib.parse.unquote(row['wikipedia'].split('/wiki/')[-1]).replace('_',' ');page=pages.get(aliases.get(title,title),{})
  if page.get('extract') and 'can mean:' not in page['extract']:row['about']=page['extract'];row['aboutSource']=row['wikipedia'];row['aboutLicense']='https://creativecommons.org/licenses/by-sa/4.0/';row['aboutCheckedAt']=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
 json.dump(rows,open(path,'w'),ensure_ascii=False,indent=2)
 print('Cached introductions:',sum(bool(r.get('about')) for r in rows))
except Exception as error:print('Retained descriptions:',error)
