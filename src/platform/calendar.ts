const dayMs=86400000;
const persian=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'});
export function tehranDate(date=new Date()):string {const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tehran'}).formatToParts(date).map(v=>[v.type,v.value]));return `${p.year}-${p.month}-${p.day}`;}
function parts(date:Date){const p=Object.fromEntries(persian.formatToParts(date).map(v=>[v.type,v.value]));return{year:Number(p.year),month:Number(p.month),day:Number(p.day)};}
export function toJalaliDate(iso:string):string {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
 const date=new Date(iso+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==iso)return '';
 const p=parts(date);return `${p.year}/${String(p.month).padStart(2,'0')}/${String(p.day).padStart(2,'0')}`;
}
export function normalizeDateDigits(text:string):string{return text.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?0x6f0:0x660)));}
/** Find an exact calendar day through Intl; invalid leap days are never normalized silently. */
export function fromJalaliDate(text:string):string|null {
 const match=/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(normalizeDateDigits(text));if(!match)return null;
 const [year,month,day]=match.slice(1).map(Number);if(year<1200||year>1600||month<1||month>12||day<1||day>31)return null;
 const wanted=year*10000+month*100+day;let low=Math.floor(Date.UTC(1800,0,1)/dayMs),high=Math.floor(Date.UTC(2240,0,1)/dayMs);
 while(low<=high){const middle=Math.floor((low+high)/2),date=new Date(middle*dayMs),p=parts(date),key=p.year*10000+p.month*100+p.day;if(key===wanted)return date.toISOString().slice(0,10);if(key<wanted)low=middle+1;else high=middle-1;}
 return null;
}
