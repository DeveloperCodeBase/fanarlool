/** Quote every field; prevent spreadsheet formulas even after leading whitespace. */
export function csvCell(value:unknown):string {
 const text=String(value??'');
 const safe=/^[\s\uFEFF]*[=+\-@]/.test(text)?"'"+text:text;
 return '"'+safe.replace(/"/g,'""')+'"';
}
