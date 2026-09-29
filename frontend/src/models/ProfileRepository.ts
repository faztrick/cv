import profileData from '../../../data/cv-data.json';
import type { Profile } from './Profile';

// One existing source of CV content, shared with the administrative toolkit.
export class ProfileRepository {
  getProfile(): Profile {
    return structuredClone(profileData);
  }
}
