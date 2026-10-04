import {useEffect,useRef,useState} from 'react';
import {useLocale} from './i18n';
import {fromJalaliDate,normalizeDateDigits,toJalaliDate} from './calendar';
const copy={fa:['تاریخ شمسی: سال/ماه/روز','تاریخ شمسی معتبر وارد کنید؛ مانند ۱۴۰۵/۰۷/۱۱.'],en:['Iranian calendar: year/month/day','Enter a valid Iranian calendar date, for example 1405/07/11.'],ar:['التقويم الشمسي: السنة/الشهر/اليوم','أدخل تاريخاً شمسياً صالحاً، مثل 1405/07/11.'],tr:['İran takvimi: yıl/ay/gün','Geçerli bir İran takvimi tarihi girin, örneğin 1405/07/11.']};
export function JalaliDateInput({value,onChange,disabled,required}:{value:string;onChange:(iso:string)=>void;disabled:boolean;required:boolean}){
 const{locale}=useLocale(),[text,setText]=useState(()=>toJalaliDate(value)),expected=useRef(value),input=useRef<HTMLInputElement>(null),c=copy[locale];
 useEffect(()=>{if(value!==expected.current){expected.current=value;setText(toJalaliDate(value));}},[value]);
 useEffect(()=>{input.current?.setCustomValidity(text&&!fromJalaliDate(text)?c[1]:'');},[text,locale]);
 return <><input ref={input} dir="ltr" type="text" maxLength={10} placeholder="1405/07/11" title={c[0]} required={required} disabled={disabled} value={text} onChange={e=>{const next=normalizeDateDigits(e.target.value),iso=fromJalaliDate(next)||'';setText(next);expected.current=iso;onChange(iso);}}/><small>{c[0]}</small></>;
}
