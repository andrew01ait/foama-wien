#!/usr/bin/env python3
"""Extract Wiener S-Bahn & train departure *schedule* data from a licensed ÖBB GTFS ZIP.

Run after downloading the official ZIP and accepting its conditions:
python scripts/prepare_rail_gtfs.py /path/to/GTFS_OP_2026_obb.zip --days 60
The resulting JSON can be imported into foama-wien or hosted as pwa/data/rail.json.
Live delays are NOT provided by the ÖBB GTFS schedule data.
"""
import argparse,csv,datetime as dt,io,json,re,zipfile,collections,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
TZ=dt.timezone(dt.timedelta(hours=1))
def open_csv(z,filename):return csv.DictReader(io.TextIOWrapper(z.open(filename),encoding='utf-8-sig',newline=''))
def asint(value,default=0):
 try:return int(value)
 except (TypeError,ValueError):return default
def mode(name):
 s=(name or '').upper().strip()
 if re.match(r'^S\s*\d+',s):return 'sbahn'
 if re.match(r'^(?:REX|CJX|R\d+\b|R\s)',s):return 'regional'
 return 'long'
def parse_hhmmss(value):
 match=re.match(r'^(\d+):(\d{2}):(\d{2})$',value or '')
 if not match:return None
 h,m,s=map(int,match.groups())
 if h>47 or m>=60 or s>=60:return None
 return h*3600+m*60+s

def build(z,days,anchor):
  local={};parents={}
  for r in open_csv(z,'stops.txt'):
   try:lat=float(r['stop_lat']);lon=float(r['stop_lon'])
   except (KeyError,ValueError):continue
   if not(48.05<lat<48.4 and 16.08<lon<16.72):continue
   local[r['stop_id']]={'name':r.get('stop_name') or 'Bahnhof','lat':lat,'lon':lon,'parent':r.get('parent_station','').strip(),'location_type':r.get('location_type','')}
  for k,v in local.items():
   group=v['parent'] if v['parent'] and v['parent'] in local else k
   # Avoid 20 individual platforms at the same station if GTFS parent station missing.
   if not v['parent'] and v['location_type']!='1':
    group='name:'+re.sub(r'\s+',' ',v['name'].casefold().strip())
   obj=parents.setdefault(group,{'id':'rail:'+group,'name':local.get(group,{}).get('name',v['name']),'lat':local.get(group,{}).get('lat',v['lat']),'lon':local.get(group,{}).get('lon',v['lon']),'provider':'rail','platformIds':[]})
   obj['platformIds'].append(k)
  routes={}
  for r in open_csv(z,'routes.txt'):
   typ=asint(r.get('route_type'))
   if typ not in (2,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,130,131,132,133):continue
   name=(r.get('route_short_name') or r.get('route_long_name') or '?').strip();routes[r['route_id']]={'name':name,'mode':mode(name)}
  trips={}
  for r in open_csv(z,'trips.txt'):
   route=routes.get(r.get('route_id'))
   if route:trips[r['trip_id']]={'service':r['service_id'],'route':route['name'],'mode':route['mode'],'towards':r.get('trip_headsign') or 'Richtung unbekannt'}
  # Calendar ranges plus special additions and exclusions for next N days.
  dates=[(anchor+dt.timedelta(days=n)) for n in range(days)]
  days_by_service=collections.defaultdict(set)
  try:
   for r in open_csv(z,'calendar.txt'):
    start=r.get('start_date','');end=r.get('end_date','')
    for date in dates:
     ymd=date.strftime('%Y%m%d')
     if start<=ymd<=end and r.get(('monday','tuesday','wednesday','thursday','friday','saturday','sunday')[date.weekday()])=='1':days_by_service[r['service_id']].add(date.isoformat())
  except KeyError:pass # Some feeds have calendar_dates only.
  try:
   for r in open_csv(z,'calendar_dates.txt'):
    try:date=dt.datetime.strptime(r['date'],'%Y%m%d').date()
    except (KeyError,ValueError):continue
    if date<anchor or date>=anchor+dt.timedelta(days=days):continue
    key=r['service_id'];typ=r.get('exception_type');
    if typ=='1':days_by_service[key].add(date.isoformat())
    elif typ=='2':days_by_service[key].discard(date.isoformat())
  except KeyError:pass
  active={key:sorted(value) for key,value in days_by_service.items() if value}
  used_ids=set(local);out=[]
  for r in open_csv(z,'stop_times.txt'):
   trip=trips.get(r.get('trip_id'))
   if not trip or trip['service'] not in active or r.get('stop_id') not in used_ids:continue
   if r.get('pickup_type')=='1':continue
   seconds=parse_hhmmss(r.get('departure_time') or r.get('arrival_time'))
   if seconds is None:continue
   out.append({'stop':r['stop_id'],'service':trip['service'],'seconds':seconds,'trip':r['trip_id'],'route':trip['route'],'towards':trip['towards'],'mode':trip['mode'],'platform':r.get('stop_headsign') or ''})
  included={r['stop'] for r in out}
  stations=[{**o,'platformIds':[p for p in o['platformIds'] if p in included]} for o in parents.values()]
  stations=[s for s in stations if s['platformIds']]
  referenced={d['service'] for d in out};valid={k:v for k,v in active.items() if k in referenced}
  return {'source':'ÖBB Open Data GTFS (CC BY 4.0); Fahrplan, keine Echtzeit','generated':dt.datetime.now(dt.timezone.utc).isoformat(),'validFrom':anchor.isoformat(),'validThrough':dates[-1].isoformat(),'stops':stations,'services':valid,'departures':out}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('gtfs',type=pathlib.Path);p.add_argument('--days',type=int,default=60);p.add_argument('--date',type=dt.date.fromisoformat,default=dt.datetime.now(dt.timezone.utc).date());p.add_argument('--out',type=pathlib.Path,default=ROOT/'pwa/data/rail.json');args=p.parse_args()
 assert 1<=args.days<=120
 with zipfile.ZipFile(args.gtfs) as z:feed=build(z,args.days,args.date)
 args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(feed,ensure_ascii=False,separators=(',',':')),encoding='utf-8');print(f'{len(feed["stops"])} Stationen; {len(feed["departures"])} Fahrplandaten; {args.out.stat().st_size/1024/1024:.1f} MB → {args.out}')
if __name__=='__main__':main()
