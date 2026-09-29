import { createContext, useContext } from 'react';
import type { PortfolioViewModel } from '../viewmodels/PortfolioViewModel';

export const PortfolioContext = createContext<PortfolioViewModel | null>(null);
export function usePortfolio(): PortfolioViewModel {
  const viewModel = useContext(PortfolioContext);
  if (!viewModel) throw new Error('Portfolio provider is missing');
  return viewModel;
}
