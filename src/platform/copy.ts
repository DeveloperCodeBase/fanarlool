import {getLocale} from './i18n';
export function w(fa:string,en:string,ar:string,tr:string){return [fa,en,ar,tr][['fa','en','ar','tr'].indexOf(getLocale())];}
