import { Property } from '../types/property';
const MOCK: Property[] = [{id:'1',stateCode:'FL',mode:'residential',residentialType:'sfr',address:'123 Main St',city:'Tampa',zip:'33601',occupancyFlags:['preforeclosure','highEquity','tenantOccupied'],marketDistressScore:50}];
export const propertyService = {
  search: (stateCode:string) => MOCK.filter(p=>p.stateCode===stateCode),
  byId: (id:string) => MOCK.find(p=>p.id===id)
};
