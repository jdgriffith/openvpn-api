import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Connection } from '../models/connection';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private endpoint = 'connections';

  constructor(private apiService: ApiService) {}

  /**
   * Get all connections
   * @returns Observable with array of Connection objects
   */
  getConnections(): Observable<Connection[]> {
    return this.apiService.get<Connection[]>(this.endpoint);
  }

  /**
   * Get connections for a specific user
   * @param userId - User ID
   * @returns Observable with array of Connection objects
   */
  getConnectionsByUser(userId: string): Observable<Connection[]> {
    return this.apiService.get<Connection[]>(this.endpoint, { userId });
  }

  /**
   * Get connection by ID
   * @param id - Connection ID
   * @returns Observable with Connection object
   */
  getConnectionById(id: string): Observable<Connection> {
    return this.apiService.get<Connection>(`${this.endpoint}/${id}`);
  }

  /**
   * Get active connections
   * @returns Observable with array of active Connection objects
   */
  getActiveConnections(): Observable<Connection[]> {
    return this.apiService.get<Connection[]>(`${this.endpoint}/active`);
  }

  /**
   * Create new connection record
   * @param connection - Connection data
   * @returns Observable with created Connection
   */
  createConnection(connection: Partial<Connection>): Observable<Connection> {
    return this.apiService.post<Connection>(this.endpoint, connection);
  }

  /**
   * Update existing connection
   * @param id - Connection ID
   * @param connectionData - Updated connection data
   * @returns Observable with updated Connection
   */
  updateConnection(
    id: string,
    connectionData: Partial<Connection>
  ): Observable<Connection> {
    return this.apiService.put<Connection>(
      `${this.endpoint}/${id}`,
      connectionData
    );
  }

  /**
   * Delete connection
   * @param id - Connection ID
   * @returns Observable of operation result
   */
  deleteConnection(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }
}
