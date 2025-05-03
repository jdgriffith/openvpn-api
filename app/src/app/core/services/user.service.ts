import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private endpoint = 'users';

  constructor(private apiService: ApiService) {}

  /**
   * Get all users
   * @returns Observable with array of User objects
   */
  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>(this.endpoint);
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @returns Observable with User object
   */
  getUserById(id: string): Observable<User> {
    return this.apiService.get<User>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new user
   * @param user - User data
   * @returns Observable with created User
   */
  createUser(user: Partial<User>): Observable<User> {
    return this.apiService.post<User>(this.endpoint, user);
  }

  /**
   * Update existing user
   * @param id - User ID
   * @param userData - Updated user data
   * @returns Observable with updated User
   */
  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.apiService.put<User>(`${this.endpoint}/${id}`, userData);
  }

  /**
   * Delete user
   * @param id - User ID
   * @returns Observable of operation result
   */
  deleteUser(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }
}
