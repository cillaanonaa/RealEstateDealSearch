export type ForeclosureType = 'judicial'|'nonJudicial'|'hybrid';
export type LeaseOptionClass = 'friendly'|'neutral'|'restrictive';
export type OwnerFinanceClass = 'minimal'|'moderate'|'strict';
export type RedemptionClass = 'none'|'short'|'long';
export type HomesteadStrength = 'weak'|'moderate'|'strong';
export type LandlordTenantClass = 'landlordFriendly'|'balanced'|'tenantFriendly';

export interface StateCriteria {
  stateCode: string;
  foreclosureType: ForeclosureType;
  leaseOptionClass: LeaseOptionClass;
  ownerFinanceClass: OwnerFinanceClass;
  redemptionClass: RedemptionClass;
  homesteadStrength: HomesteadStrength;
  landlordTenantClass: LandlordTenantClass;
}
