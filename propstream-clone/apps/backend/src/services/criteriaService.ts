import { STATE_CRITERIA } from '../data/stateCriteria';
export const criteriaService = {
  all: () => Object.values(STATE_CRITERIA),
  byCode: (code:string) => STATE_CRITERIA[code.toUpperCase()]
};
