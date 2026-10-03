export type EconomicsInput={quantity:number;scrapBefore:number;scrapAfter:number;rejectNetCost:number;downtimeHours:number;downtimeReduction:number;avoidableHourlyLoss:number;energyCost:number;energyReduction:number;releasedHours:number;hourValue:number;cashLabor:boolean;investment:number;annualOperatingCost:number;realization:number};
export function calculateEconomics(v:EconomicsInput){
 const bounded=[v.scrapBefore,v.scrapAfter,v.downtimeReduction,v.energyReduction,v.realization];
 if(Object.values(v).some(n=>typeof n==='number'&&(!Number.isFinite(n)||n<0))||bounded.some(n=>n>100)||v.scrapAfter>v.scrapBefore)throw new Error('مقادیر باید مثبت و درصدها در محدوده باشند؛ ضایعات هدف بیشتر از مبنا نباشد.');
 const scrap=v.quantity*(v.scrapBefore-v.scrapAfter)/100*v.rejectNetCost;
 const downtime=v.downtimeHours*v.downtimeReduction/100*v.avoidableHourlyLoss;
 const energy=v.energyCost*v.energyReduction/100,opportunity=v.releasedHours*v.hourValue;
 const gross=(scrap+downtime+energy+(v.cashLabor?opportunity:0))*v.realization/100;
 const net=gross-v.annualOperatingCost;
 return {scrap,downtime,energy,opportunity,gross,net,paybackMonths:net>0?v.investment/net*12:null,annualRoi:v.investment>0?net/v.investment*100:null,avoidedDefects:v.quantity*(v.scrapBefore-v.scrapAfter)/100};
}
