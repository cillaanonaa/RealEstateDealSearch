import { StateCriteria } from '../types/criteria';
import { Property } from '../types/property';
import { StrategyScores } from '../types/scoring';

const cap = (n:number)=>Math.max(0,Math.min(100,Math.round(n)));
const has=(p:Property,f:string)=>p.occupancyFlags.includes(f as any);

export function scoreProperty(criteria:StateCriteria, property:Property, riskSlider:number): StrategyScores {
  let pre=0, lease=0, own=0, inv=0;
  pre += {judicial:20,hybrid:10,nonJudicial:0}[criteria.foreclosureType];
  pre += {long:20,short:10,none:0}[criteria.redemptionClass];
  pre += {weak:10,moderate:5,strong:0}[criteria.homesteadStrength];
  pre += {landlordFriendly:10,balanced:5,tenantFriendly:0}[criteria.landlordTenantClass];
  pre += has(property,'preforeclosure')?30:0; pre += has(property,'auction')?20:0; pre += has(property,'bankOwned')?15:0;
  const distress=['taxDelinquent','probate','codeViolation','liens'].filter(f=>has(property,f)).length;
  pre += Math.min(20,distress*10); pre += (property.marketDistressScore||0)*0.2;

  lease += {friendly:40,neutral:20,restrictive:0}[criteria.leaseOptionClass];
  lease += {landlordFriendly:20,balanced:10,tenantFriendly:0}[criteria.landlordTenantClass];
  lease += {weak:10,moderate:5,strong:0}[criteria.homesteadStrength];
  lease += property.mode==='commercial'?5:20; lease += has(property,'tenantOccupied')?10:(has(property,'ownerOccupied')||has(property,'vacant')?5:0);

  own += {minimal:40,moderate:25,strict:5}[criteria.ownerFinanceClass];
  own += {weak:10,moderate:5,strong:0}[criteria.homesteadStrength];
  own += {landlordFriendly:10,balanced:5,tenantFriendly:0}[criteria.landlordTenantClass];
  own += property.mode==='commercial'?10:20;
  ['absenteeOwner','freeAndClear','highEquity'].forEach(f=>{if(has(property,f)) own+=15;});
  if(has(property,'lowEquity')) own+=5;

  inv += {landlordFriendly:30,balanced:20,tenantFriendly:5}[criteria.landlordTenantClass];
  inv += {weak:20,moderate:10,strong:0}[criteria.homesteadStrength];
  inv += criteria.foreclosureType==='judicial'?10:5;
  if(has(property,'highEquity')||has(property,'freeAndClear')) inv+=15;
  if(has(property,'absenteeOwner')||has(property,'vacant')) inv+=10;
  if(has(property,'tenantOccupied')) inv+=5;
  inv += (property.marketDistressScore||0)*0.2;

  pre=cap(pre); lease=cap(lease); own=cap(own); inv=cap(inv);
  const ip=cap(0.25*pre+0.25*lease+0.25*own+0.25*inv);
  const rb=riskSlider/100;
  const preA=cap((0.7*pre+0.3*ip)*(1-rb)+ip*rb);
  const leaseA=cap((0.7*lease+0.3*ip)*(1-rb)+ip*rb);
  const ownA=cap((0.7*own+0.3*ip)*(1-rb)+ip*rb);
  const riskPenalty = 1-rb*((100-ip)/100);
  const final=cap(ip*riskPenalty);
  return {preforeclosureBase:pre,leaseOptionBase:lease,ownerFinanceBase:own,investorFriendlyBase:inv,investmentProbability:ip,preforeclosureAdjusted:preA,leaseOptionAdjusted:leaseA,ownerFinanceAdjusted:ownA,finalAdjustedInvestmentScore:final,explanations:[`${criteria.foreclosureType} foreclosure, ${criteria.redemptionClass} redemption`,`lease-option: ${criteria.leaseOptionClass}, owner-finance: ${criteria.ownerFinanceClass}`,`Risk slider ${riskSlider}`]};
}
