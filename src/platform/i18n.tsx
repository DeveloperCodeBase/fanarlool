import {useSyncExternalStore} from 'react';
import dictionary from './translations.json';
export type Language='fa'|'en'|'ar'|'tr';
const languages:Language[]=['fa','en','ar','tr'];
let current:Language='fa';
try {const saved=localStorage.getItem('fanar-locale');if(languages.includes(saved as Language))current=saved as Language;}catch{}
const subscribers=new Set<()=>void>();
export const getLocale=()=>current;
export const direction=(locale:Language)=>locale==='fa'||locale==='ar'?'rtl':'ltr';
export function setLocale(locale:Language){if(!languages.includes(locale))return;current=locale;try{localStorage.setItem('fanar-locale',locale);}catch{}applyLocale();subscribers.forEach(fn=>fn());}
export function applyLocale(){if(typeof document==='undefined')return;document.documentElement.lang=current;document.documentElement.dir=direction(current);document.title=translate('فنر لول ایران')+' | '+translate('پلتفرم تولید هوشمند');}
export function translate(text:unknown,locale:Language=current):string{const source=String(text??'');if(locale==='fa')return source;const found=(dictionary as Record<string,string[]>)[source];if(found)return found[languages.indexOf(locale)-1];
 for(const suffix of [' خارج از محدوده است',' انتخاب معتبر نیست',' تاریخ معتبر نیست',' معتبر نیست'])if(source.endsWith(suffix))return translate(source.slice(0,-suffix.length),locale)+' '+translate(suffix.trim(),locale);
 return source;
}
export function useLocale(){const locale=useSyncExternalStore(fn=>{subscribers.add(fn);return()=>subscribers.delete(fn);},getLocale,getLocale);return{locale,setLocale,t:translate,dir:direction(locale)};}
export function LanguageSelector(){const{locale,setLocale}=useLocale();return <label className="language-selector"><span>{translate('زبان')}</span><select aria-label={translate('زبان')} value={locale} onChange={e=>setLocale(e.target.value as Language)}>{[['fa','فارسی'],['en','English'],['ar','العربية'],['tr','Türkçe']].map(([code,name])=><option lang={code} key={code} value={code}>{name}</option>)}</select></label>;}
applyLocale();
