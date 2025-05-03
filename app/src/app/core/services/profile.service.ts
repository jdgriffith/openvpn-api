import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile } from '../models/profile';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private endpoint = 'profiles';

  constructor(private apiService: ApiService) {}

  /**
   * Get all VPN profiles
   * @returns Observable with array of Profile objects
   */
  getProfiles(): Observable<Profile[]> {
    return this.apiService.get<Profile[]>(this.endpoint);
  }

  /**
   * Get profile by ID
   * @param id - Profile ID
   * @returns Observable with Profile object
   */
  getProfileById(id: string): Observable<Profile> {
    return this.apiService.get<Profile>(`${this.endpoint}/${id}`);
  }

  /**
   * Get default profile
   * @returns Observable with default Profile object
   */
  getDefaultProfile(): Observable<Profile> {
    return this.apiService.get<Profile>(`${this.endpoint}/default`);
  }

  /**
   * Create new profile
   * @param profile - Profile data
   * @returns Observable with created Profile
   */
  createProfile(profile: Partial<Profile>): Observable<Profile> {
    return this.apiService.post<Profile>(this.endpoint, profile);
  }

  /**
   * Update existing profile
   * @param id - Profile ID
   * @param profileData - Updated profile data
   * @returns Observable with updated Profile
   */
  updateProfile(
    id: string,
    profileData: Partial<Profile>
  ): Observable<Profile> {
    return this.apiService.put<Profile>(`${this.endpoint}/${id}`, profileData);
  }

  /**
   * Delete profile
   * @param id - Profile ID
   * @returns Observable of operation result
   */
  deleteProfile(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Set profile as default
   * @param id - Profile ID to set as default
   * @returns Observable with updated Profile
   */
  setDefaultProfile(id: string): Observable<Profile> {
    return this.apiService.put<Profile>(`${this.endpoint}/${id}/default`, {});
  }
}
