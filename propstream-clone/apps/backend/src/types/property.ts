export type Mode = 'residential'|'commercial';
export type Strategy = 'preforeclosure'|'leaseOption'|'ownerFinancing'|'all';
export type OccupancyFlags =
  |'ownerOccupied'|'tenantOccupied'|'vacant'|'absenteeOwner'|'corporateOwned'|'governmentOwned'
  |'bankOwned'|'preforeclosure'|'auction'|'probate'|'taxDelinquent'|'codeViolation'|'liens'
  |'highEquity'|'lowEquity'|'freeAndClear';

export interface Property {
  id: string; stateCode: string; mode: Mode; residentialType?: string; commercialType?: string;
  address: string; city: string; zip: string; marketDistressScore?: number;
  occupancyFlags: OccupancyFlags[];
}
