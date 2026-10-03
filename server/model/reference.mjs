import {createHash} from 'node:crypto';
export const dataset={id:'uci-steel-plates-faults-198',name:'Steel Plates Faults',doi:'10.24432/C5J88N',url:'https://archive.ics.uci.edu/dataset/198/steel%2Bplates%2Bfaults',download:'https://archive.ics.uci.edu/static/public/198/steel%2Bplates%2Bfaults.zip',license:'CC BY 4.0',attribution:'Buscema, M., Terzi, S., & Tastle, W. (2010). Steel Plates Faults. UCI Machine Learning Repository.',features:['X_Minimum','X_Maximum','Y_Minimum','Y_Maximum','Pixels_Areas','X_Perimeter','Y_Perimeter','Sum_of_Luminosity','Minimum_of_Luminosity','Maximum_of_Luminosity','Length_of_Conveyer','TypeOfSteel_A300','TypeOfSteel_A400','Steel_Plate_Thickness','Edges_Index','Empty_Index','Square_Index','Outside_X_Index','Edges_X_Index','Edges_Y_Index','Outside_Global_Index','LogOfAreas','Log_X_Index','Log_Y_Index','Orientation_Index','Luminosity_Index','SigmoidOfAreas'],classes:['Pastry','Z_Scratch','K_Scratch','Stains','Dirtiness','Bumps','Other_Faults']};
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export function parseDataset(text){
 const rows=text.trim().split(/\r?\n/).map((line,id)=>{const values=line.trim().split(/\s+/).map(Number);if(values.length!==34||values.some(v=>!Number.isFinite(v)))throw new Error(`Invalid feature row ${id+1}`);const labels=values.slice(27);if(labels.some(v=>v!==0&&v!==1)||labels.reduce((a,b)=>a+b,0)!==1)throw new Error(`Invalid one-hot label ${id+1}`);return {id,x:values.slice(0,27),y:labels.indexOf(1)};});
 if(rows.length!==1941)throw new Error('Dataset cardinality changed; review provenance before training');return rows;
}
function random(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function splitDataset(rows,seed=14050711){
 const groups=new Map();for(const row of rows){const key=JSON.stringify(row.x);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
 const train=[],test=[],rnd=random(seed);
 for(let label=0;label<7;label++){const bucket=[...groups.values()].filter(g=>g[0].y===label);for(let i=bucket.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[bucket[i],bucket[j]]=[bucket[j],bucket[i]];}const cut=Math.max(1,Math.min(bucket.length-1,Math.round(bucket.length*.8)));bucket.forEach((g,i)=>(i<cut?train:test).push(...g));}
 if(!train.length||!test.length)throw new Error('Empty fold');
 return {train:train.sort((a,b)=>a.id-b.id),test:test.sort((a,b)=>a.id-b.id),seed,duplicateRows:rows.length-groups.size};
}
export function fitScaler(rows){if(!rows.length)throw new Error('Empty training fold');const mean=Array(27).fill(0),scale=Array(27).fill(0);for(const row of rows)row.x.forEach((v,j)=>mean[j]+=v/rows.length);for(const row of rows)row.x.forEach((v,j)=>scale[j]+=(v-mean[j])**2/rows.length);return {mean,scale:scale.map(v=>Math.sqrt(v)||1)};}
function transform(x,scaler){if(x.length!==27||x.some(v=>!Number.isFinite(v)))throw new Error('Exactly 27 finite numeric features required');return [...x.map((v,j)=>Math.max(-10,Math.min(10,(v-scaler.mean[j])/scaler.scale[j]))),1];}
function softmax(scores){const max=Math.max(...scores),exp=scores.map(v=>Math.exp(v-max)),sum=exp.reduce((a,b)=>a+b,0);return exp.map(v=>v/sum);}
export function predict(model,x){const vector=transform(x,model.scaler),probabilities=softmax(model.weights.map(w=>w.reduce((sum,v,j)=>sum+v*vector[j],0)));return {label:probabilities.indexOf(Math.max(...probabilities)),probabilities};}
export function trainBaseline(rows,{epochs=400,learningRate=.15,l2=.002}={}){
 if(!Number.isInteger(epochs)||epochs<1||epochs>2000||!Number.isFinite(learningRate)||learningRate<=0||!Number.isFinite(l2)||l2<0)throw new Error('Invalid fixed hyperparameters');
 const scaler=fitScaler(rows),vectors=rows.map(row=>transform(row.x,scaler)),weights=Array.from({length:7},()=>Array(28).fill(0));
 for(let epoch=0;epoch<epochs;epoch++){const gradient=Array.from({length:7},()=>Array(28).fill(0));for(let i=0;i<rows.length;i++){const x=vectors[i],p=softmax(weights.map(w=>w.reduce((sum,v,j)=>sum+v*x[j],0)));for(let c=0;c<7;c++){const error=p[c]-(rows[i].y===c?1:0);for(let j=0;j<28;j++)gradient[c][j]+=error*x[j]/rows.length;}}for(let c=0;c<7;c++)for(let j=0;j<28;j++)weights[c][j]-=learningRate*(gradient[c][j]+(j===27?0:l2*weights[c][j]));}
 return {algorithm:'multinomial-logistic-regression',version:1,scaler,weights,hyperparameters:{epochs,learningRate,l2,zClip:10},classes:dataset.classes,features:dataset.features};
}
export function evaluate(model,rows){
 if(!rows.length)throw new Error('Empty evaluation fold');const confusion=Array.from({length:7},()=>Array(7).fill(0));let logLoss=0;for(const row of rows){const prediction=predict(model,row.x);confusion[row.y][prediction.label]++;logLoss-=Math.log(Math.max(1e-15,prediction.probabilities[row.y]));}
 const perClass=confusion.map((r,c)=>{const support=r.reduce((a,b)=>a+b,0),predicted=confusion.reduce((a,row)=>a+row[c],0),precision=predicted?r[c]/predicted:0,recall=support?r[c]/support:0;return {class:dataset.classes[c],support,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0};});
 return {samples:rows.length,accuracy:confusion.reduce((a,r,c)=>a+r[c],0)/rows.length,balancedAccuracy:perClass.reduce((a,c)=>a+c.recall,0)/7,macroF1:perClass.reduce((a,c)=>a+c.f1,0)/7,logLoss:logLoss/rows.length,confusion,perClass};
}
