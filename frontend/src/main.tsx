import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { configure } from 'mobx';
import { PortfolioViewModel } from './viewmodels/PortfolioViewModel';
import { PortfolioContext } from './views/PortfolioContext';
import { App } from './views/App';
import './styles.css';

configure({ enforceActions: 'always' });
const viewModel = new PortfolioViewModel();
const root = document.getElementById('root');
if (!root) throw new Error('Portfolio root is missing');
const app = <StrictMode><PortfolioContext.Provider value={viewModel}><App /></PortfolioContext.Provider></StrictMode>;
if (root.childElementCount > 0) hydrateRoot(root, app);
else createRoot(root).render(app);
