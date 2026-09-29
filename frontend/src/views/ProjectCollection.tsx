import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { usePortfolio } from './PortfolioContext';

export const ProjectCollection = observer(function ProjectCollection() {
  const vm = usePortfolio();
  return <section className="section" id="work" aria-labelledby="work-heading">
    <div className="section-heading"><div><span className="eyebrow">01 / SELECTED WORK</span><h2 id="work-heading">Ideas, made real.</h2></div><p>Enterprise software. Connected devices.<br />Practical applications of AI.</p></div>
    <div className="work-tools">
      <div className="filters" aria-label="Project categories">{vm.categories.map(category => <button key={category} className={vm.category === category ? 'filter active' : 'filter'} aria-pressed={vm.category === category} onClick={() => vm.selectCategory(category)}>{category}</button>)}</div>
      <label className="search"><span className="sr-only">Search projects and technologies</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input type="search" placeholder="Find a project or technology" value={vm.query} onChange={event => vm.setQuery(event.target.value)} /></label>
    </div>
    <p className="result-count" aria-live="polite">{vm.matchingProjects.length} projects{vm.query ? ` matching “${vm.query}”` : ' across software and systems'}</p>
    <div className="project-grid">{vm.visibleProjects.map((project, index) => <article className="project-card" key={project.name}>
      <button className="project-open" onClick={() => vm.openProject(project)} aria-label={`Read about ${project.name}`}>
        <div className={`project-art art-${index % 4}`} aria-hidden="true"><div className="art-grid" /><span className="art-label">{project.category}</span><span className="art-monogram">{project.name.split(/\s/).map(word => word[0]).slice(0, 2).join('')}</span><span className="art-index">{String(vm.profile.projects.indexOf(project) + 1).padStart(2, '0')}</span><span className="art-arrow">↗</span></div>
        <div className="project-body"><div className="project-heading"><h3>{project.name}</h3><span aria-hidden="true">↗</span></div><p>{project.description}</p><div className="tags">{project.technologies.slice(0, 4).map(tech => <span key={tech}>{tech}</span>)}</div></div>
      </button>
    </article>)}</div>
    {vm.matchingProjects.length === 0 && <div className="empty-state"><h3>No projects match yet.</h3><p>Try a different technology or category.</p><button className="button secondary" onClick={vm.resetFilters}>Clear filters</button></div>}
    {vm.hasMoreProjects && <div className="show-more"><button className="button secondary" onClick={vm.revealProjects}>View all {vm.matchingProjects.length} projects <span aria-hidden="true">↓</span></button></div>}
  </section>;
});

export const ProjectDialog = observer(function ProjectDialog() {
  const vm = usePortfolio();
  const ref = useRef<HTMLDialogElement>(null);
  const project = vm.selectedProject;
  useEffect(() => {
    if (project) ref.current?.showModal();
    else ref.current?.close();
  }, [project]);
  return <dialog ref={ref} className="project-dialog" aria-labelledby="project-dialog-title" onCancel={vm.closeProject} onClose={vm.closeProject} onClick={event => { if (event.target === event.currentTarget) vm.closeProject(); }}>
    {project && <div className="dialog-content"><button className="dialog-close" aria-label="Close project details" onClick={vm.closeProject}>×</button><span className="eyebrow">{project.category}</span><h2 id="project-dialog-title">{project.name}</h2><p>{project.description}</p><div className="tags">{project.technologies.map(tech => <span key={tech}>{tech}</span>)}</div><div className="dialog-note">{project.status}</div><a className="button primary" href={vm.emailUrl}>Discuss this project <span aria-hidden="true">↗</span></a></div>}
  </dialog>;
});
