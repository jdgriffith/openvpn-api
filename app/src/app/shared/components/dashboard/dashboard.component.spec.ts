import { describe, it, expect, mock } from 'bun:test';
import { DashboardComponent } from './dashboard.component';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  it('should create', () => {
    const mockUserService = {
      getUsers: mock(() => of([])),
      getActiveUsersCount: mock(() => of(0))
    };
    const mockConnectionService = {
      getConnections: mock(() => of([])),
      getActiveConnectionsCount: mock(() => of(0)),
      getRecentConnections: mock(() => of([]))
    };
    const mockProfileService = {
      getProfiles: mock(() => of([]))
    };

    const component = new DashboardComponent(
      mockUserService as any,
      mockConnectionService as any,
      mockProfileService as any
    );

    expect(component).toBeTruthy();
  });
});
