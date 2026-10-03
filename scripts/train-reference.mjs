import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {inflateRawSync} from 'node:zlib';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {dataset,sha256,parseDataset,splitDataset,trainBaseline,evaluate} from '../server/model/reference.mjs';

// Run only through the project VPS wrapper. This script never opens a listener.
if(process.platform!=='linux')throw new Error('Reference training is VPS-only');
const output=resolve(process.argv[2]||'');
if(!output.startsWith('/var/www/fanarlool/shared/models/'))throw new Error('Output must stay in the dedicated project model directory');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[0-9a-f]{40}$/.test(sha))throw new Error('Invalid source SHA');
const response=await fetch(dataset.download,{signal:AbortSignal.timeout(45000)});
if(!response.ok)throw new Error(`Official dataset download HTTP ${response.status}`);
const zip=Buffer.from(await response.arrayBuffer());if(zip.length>2_000_000)throw new Error('Unexpected archive size');
// Read the ZIP central directory; only the expected small data file is inflated.
let end=-1;for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--)if(zip.readUInt32LE(i)===0x06054b50){end=i;break;}
if(end<0)throw new Error('Invalid ZIP archive');let offset=zip.readUInt32LE(end+16),raw;
for(let n=0;n<zip.readUInt16LE(end+10);n++){if(zip.readUInt32LE(offset)!==0x02014b50)throw new Error('Invalid ZIP entry');const method=zip.readUInt16LE(offset+10),packed=zip.readUInt32LE(offset+20),size=zip.readUInt32LE(offset+24),nameSize=zip.readUInt16LE(offset+28),extraSize=zip.readUInt16LE(offset+30),commentSize=zip.readUInt16LE(offset+32),local=zip.readUInt32LE(offset+42),name=zip.subarray(offset+46,offset+46+nameSize).toString();if(name==='Faults.NNA'){if(size>1_000_000)throw new Error('Unexpected data size');const start=local+30+zip.readUInt16LE(local+26)+zip.readUInt16LE(local+28),data=zip.subarray(start,start+packed);if(method!==0&&method!==8)throw new Error('Unsupported ZIP compression');raw=method===8?inflateRawSync(data,{maxOutputLength:1_000_000}):data;if(raw.length!==size)throw new Error('Truncated dataset');}offset+=46+nameSize+extraSize+commentSize;}
if(!raw)throw new Error('Official Faults.NNA not found');
const previous=JSON.parse(await readFile(new URL('../server/model/reference-result.json',import.meta.url),'utf8'));
if(previous.status==='trained-reference'&&previous.dataset.dataSha256!==sha256(raw))throw new Error('Published dataset hash changed; provenance review required');
const rows=parseDataset(raw.toString('utf8')),split=splitDataset(rows),model=trainBaseline(split.train),metrics=evaluate(model,split.test),counts=Array(7).fill(0);rows.forEach(r=>counts[r.y]++);
const result={status:'trained-reference',sourceSha:sha,trainedAtUnix:Date.now(),trainedAtJalali:new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'long',timeZone:'Asia/Tehran'}).format(new Date()),dataset:{...dataset,archiveSha256:sha256(zip),dataSha256:sha256(raw),rows:rows.length,classCounts:counts},split:{seed:split.seed,train:split.train.length,test:split.test.length,duplicateRows:split.duplicateRows,trainIdsSha256:sha256(JSON.stringify(split.train.map(r=>r.id))),testIdsSha256:sha256(JSON.stringify(split.test.map(r=>r.id))),method:'80/20 seeded stratified feature-group split'},model,metrics,examples:split.test.slice(0,3).map(r=>({id:r.id,features:r.x,actualClass:dataset.classes[r.y]})),limitations:['Public steel-plate tabular reference, not FanarLool factory measurements.','No image inference or dimensional calibration.','No factory acceptance or proprietary language model training.','Fixed hyperparameters; test fold was not used for tuning.','No batch or production-line identifiers supplied; external domain validation remains required.','Softmax scores are uncalibrated; do not interpret them as certified confidence.']};
await mkdir(output,{recursive:true,mode:0o700});await writeFile(resolve(output,'reference-result.json'),JSON.stringify(result,null,2),{mode:0o600});await writeFile(resolve(output,'Faults.NNA'),raw,{mode:0o600});
console.log(JSON.stringify({status:result.status,sourceSha:sha,dataSha256:result.dataset.dataSha256,train:split.train.length,test:split.test.length,metrics}));
console.log('REFERENCE_ARTIFACT_BASE64 '+Buffer.from(JSON.stringify(result,null,2)).toString('base64'));
