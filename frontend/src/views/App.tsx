import { observer } from 'mobx-react-lite';
import { usePortfolio } from './PortfolioContext';
import { ProjectCollection, ProjectDialog } from './ProjectCollection';

const navigation = [['Work', '#work'], ['About', '#about'], ['Experience', '#experience'], ['Contact', '#contact']] as const;

const Header = observer(function Header() {
  const vm = usePortfolio();
  return <header className="site-header"><a className="wordmark" href="#home" aria-label="Fasil, back to top">fasil<span>.</span></a><nav className={vm.menuOpen ? 'navigation open' : 'navigation'} aria-label="Main navigation">{navigation.map(([label, href]) => <a key={href} href={href} onClick={vm.closeMenu}>{label}</a>)}</nav><a href="/cv.html" className="header-cv">View CV <span aria-hidden="true">↗</span></a><button className="menu-toggle" onClick={vm.toggleMenu} aria-expanded={vm.menuOpen} aria-label={vm.menuOpen ? 'Close navigation' : 'Open navigation'}>{vm.menuOpen ? 'Close' : 'Menu'}</button></header>;
});

const Hero = observer(function Hero() {
  const vm = usePortfolio();
  const person = vm.profile.personalInfo;
  return <section className="hero" id="home" aria-labelledby="hero-heading"><div className="hero-copy"><div className="intro-line"><span className="status-dot" />{person.location}<span className="intro-divider">/</span>{person.title}</div><h1 id="hero-heading">Building software.<br /><span>Connecting systems.</span></h1><p className="hero-intro">I’m {person.name}.<br />{vm.profile.summary}</p><div className="hero-actions"><a className="button primary" href="#work">Explore my work <span aria-hidden="true">↗</span></a><a className="text-link" href="/cv.html">Read my CV <span aria-hidden="true">↗</span></a></div><div className="hero-footnote"><span className="status-dot" />{vm.profile.availability.status}</div></div><div className="portrait-block"><div className="portrait-frame"><img src="/assets/profile-photo.jpg" alt={person.name} width="640" height="800" fetchPriority="high" /><div className="portrait-caption"><span>SOFTWARE / SYSTEMS / AI</span><span>↗</span></div></div><div className="portrait-note"><span className="hand-mark" aria-hidden="true">↳</span><p>From the interface<br />to the infrastructure.</p></div></div></section>;
});

const About = observer(function About() {
  const { profile } = usePortfolio();
  return <section className="section about-section" id="about" aria-labelledby="about-heading"><div className="about-intro"><span className="eyebrow">02 / THE WAY I WORK</span><h2 id="about-heading">Software that works<br />in the real world.</h2><p>{profile.summary}</p><a className="text-link" href="/resume.pdf" download>Download résumé <span aria-hidden="true">↓</span></a></div><div className="about-details"><div className="stats"><div><strong>{profile.yearsOfExperience}+</strong><span>Years of experience</span></div><div><strong>{profile.projects.length.toString().padStart(2, '0')}</strong><span>Selected projects</span></div><div><strong>{profile.experience.length.toString().padStart(2, '0')}</strong><span>Career chapters</span></div></div><h3>A connected toolkit</h3><div className="skill-list">{profile.skills.map(skill => <span key={skill}>{skill}</span>)}</div><ul className="highlights">{profile.highlights.map(highlight => <li key={highlight}><span aria-hidden="true">↗</span>{highlight}</li>)}</ul></div></section>;
});

const Experience = observer(function Experience() {
  const { profile } = usePortfolio();
  return <section className="section experience-section" id="experience" aria-labelledby="experience-heading"><div className="section-heading"><div><span className="eyebrow">03 / EXPERIENCE</span><h2 id="experience-heading">Built over time.</h2></div><a href="/cv.html" className="text-link">Full résumé <span aria-hidden="true">↗</span></a></div><div className="timeline">{profile.experience.map((job, index) => <article className="timeline-row" key={`${job.company}-${job.duration}`}><div className="timeline-date"><span className={index === 0 ? 'timeline-dot current' : 'timeline-dot'} />{job.duration}</div><div className="timeline-main"><h3>{job.role}</h3><p className="company">{job.company} <span>· {job.location}</span></p><p>{job.description}</p></div><span className="timeline-number" aria-hidden="true">0{index + 1}</span></article>)}</div></section>;
});

const Contact = observer(function Contact() {
  const vm = usePortfolio();
  const person = vm.profile.personalInfo;
  const safeLink = (value: string) => { try { const url = new URL(value.startsWith('http') ? value : `https://${value}`); return url.protocol === 'https:' ? url.href : undefined; } catch { return undefined; } };
  return <section className="contact-section" id="contact" aria-labelledby="contact-heading"><div><span className="eyebrow">04 / LET’S CONNECT</span><h2 id="contact-heading">Have something<br />in mind?</h2><p>Let’s talk about the next thing you’re building.</p><a className="contact-email" href={vm.emailUrl}>{person.email} <span aria-hidden="true">↗</span></a></div><div className="contact-aside"><span className="contact-star" aria-hidden="true">✳</span><p>{person.location}</p><a href={vm.phoneUrl}>{person.phone}</a><div className="social-links"><a href={safeLink(person.linkedin)} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href={safeLink(person.github)} target="_blank" rel="noopener noreferrer">GitHub ↗</a></div></div></section>;
});

export const App = observer(function App() {
  const { profile } = usePortfolio();
  return <><a className="skip-link" href="#main">Skip to content</a><div className="page-shell"><Header /><main id="main"><Hero /><div className="discipline-strip" aria-label="Specialties"><span>FULL-STACK DEVELOPMENT</span><span aria-hidden="true">✳</span><span>AI & AUTOMATION</span><span aria-hidden="true">✳</span><span>CONNECTED SYSTEMS</span></div><ProjectCollection /><About /><Experience /><Contact /></main><footer className="site-footer"><span>© {new Date().getFullYear()} {profile.personalInfo.name}</span><span>Thoughtfully built. Always evolving.</span><a href="#home">Back to top ↑</a></footer></div><ProjectDialog /></>;
});
