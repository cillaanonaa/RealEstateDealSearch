export interface StrategyScores {
  preforeclosureBase: number;
  leaseOptionBase: number;
  ownerFinanceBase: number;
  investorFriendlyBase: number;
  investmentProbability: number;
  preforeclosureAdjusted: number;
  leaseOptionAdjusted: number;
  ownerFinanceAdjusted: number;
  finalAdjustedInvestmentScore: number;
  explanations: string[];
}
