import { renderToString } from 'react-dom/server';
import { enableStaticRendering } from 'mobx-react-lite';
import { PortfolioViewModel } from './viewmodels/PortfolioViewModel';
import { PortfolioContext } from './views/PortfolioContext';
import { App } from './views/App';

enableStaticRendering(true);
export function render(): string {
  return renderToString(<PortfolioContext.Provider value={new PortfolioViewModel()}><App /></PortfolioContext.Provider>);
}
