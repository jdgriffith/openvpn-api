import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   * @param endpoint - API endpoint
   * @param params - URL parameters
   * @returns Observable of response
   */
  get<T>(endpoint: string, params: any = {}): Observable<T> {
    const options = { params: this.buildParams(params) };
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, options);
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param data - Request payload
   * @returns Observable of response
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  /**
   * PUT request
   * @param endpoint - API endpoint
   * @param data - Request payload
   * @returns Observable of response
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @returns Observable of response
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }

  /**
   * Build URL parameters
   * @param params - Object containing parameters
   * @returns HttpParams object
   */
  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        httpParams = httpParams.set(key, params[key]);
      }
    }
    return httpParams;
  }
}
