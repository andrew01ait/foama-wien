// Node-only preview/test adapter. Production uses the provisioned Cloudflare D1 binding.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function localD1(path=':memory:'){
 const db=new DatabaseSync(path);
 db.exec('CREATE TABLE IF NOT EXISTS __foama_preview_migrations (name TEXT PRIMARY KEY)');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()){
  if(!db.prepare('SELECT name FROM __foama_preview_migrations WHERE name=?').get(name)){db.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));db.prepare('INSERT INTO __foama_preview_migrations VALUES (?)').run(name);}
 }
 return {prepare(sql){let values=[];const api={bind(...args){values=args;return api;},async first(){return db.prepare(sql).get(...values)||null;},async all(){return {results:db.prepare(sql).all(...values),success:true};},async run(){const result=db.prepare(sql).run(...values);return {success:true,meta:{changes:Number(result.changes)}};}};return api;},close:()=>db.close()};
}
