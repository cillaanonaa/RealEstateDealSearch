import { StateCriteria } from '../types/criteria';
export const STATE_CRITERIA: Record<string, StateCriteria> = {
  FL:{stateCode:'FL',foreclosureType:'judicial',leaseOptionClass:'friendly',ownerFinanceClass:'minimal',redemptionClass:'short',homesteadStrength:'strong',landlordTenantClass:'landlordFriendly'},
  TX:{stateCode:'TX',foreclosureType:'nonJudicial',leaseOptionClass:'restrictive',ownerFinanceClass:'strict',redemptionClass:'none',homesteadStrength:'strong',landlordTenantClass:'landlordFriendly'},
  CA:{stateCode:'CA',foreclosureType:'nonJudicial',leaseOptionClass:'neutral',ownerFinanceClass:'strict',redemptionClass:'none',homesteadStrength:'moderate',landlordTenantClass:'tenantFriendly'}
};
