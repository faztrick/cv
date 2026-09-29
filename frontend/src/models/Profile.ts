export interface Experience {
  role: string;
  company: string;
  location: string;
  duration: string;
  description: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  status: string;
  category: string;
}

export interface Profile {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio?: string;
    whatsapp?: string;
    website?: string;
  };
  summary: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  highlights: string[];
  availability: { status: string; location: string; visa: string };
  yearsOfExperience: number;
}
