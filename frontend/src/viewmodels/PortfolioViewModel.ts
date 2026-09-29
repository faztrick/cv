import { makeAutoObservable, observableRef } from 'mobx';
import type { Profile, Project } from '../models/Profile';
import { ProfileRepository } from '../models/ProfileRepository';

export class PortfolioViewModel {
  readonly profile: Profile;
  category = 'All work';
  query = '';
  showAll = false;
  menuOpen = false;
  selectedProject: Project | null = null;

  constructor(repository = new ProfileRepository()) {
    this.profile = repository.getProfile();
    makeAutoObservable(this, { profile: observableRef, selectedProject: observableRef }, { autoBind: true });
  }

  get categories(): string[] {
    return ['All work', ...new Set(this.profile.projects.map(project => project.category))];
  }

  get matchingProjects(): Project[] {
    const query = this.query.trim().toLocaleLowerCase();
    return this.profile.projects.filter(project =>
      (this.category === 'All work' || project.category === this.category) &&
      (!query || [project.name, project.description, ...project.technologies].join(' ').toLocaleLowerCase().includes(query))
    );
  }

  get visibleProjects(): Project[] {
    return this.showAll ? this.matchingProjects : this.matchingProjects.slice(0, 6);
  }

  get hasMoreProjects(): boolean { return this.visibleProjects.length < this.matchingProjects.length; }
  get emailUrl(): string { return `mailto:${this.profile.personalInfo.email}`; }
  get phoneUrl(): string { return `tel:${this.profile.personalInfo.phone.replace(/[^+\d]/g, '')}`; }

  selectCategory(category: string): void {
    if (!this.categories.includes(category)) return;
    this.category = category;
    this.showAll = false;
  }
  setQuery(query: string): void { this.query = query; this.showAll = false; }
  revealProjects(): void { this.showAll = true; }
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  openProject(project: Project): void { this.selectedProject = project; }
  closeProject(): void { this.selectedProject = null; }
  resetFilters(): void { this.query = ''; this.category = 'All work'; this.showAll = false; }
}
