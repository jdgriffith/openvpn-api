import { describe, it, expect, mock } from 'bun:test';
import { ConnectionListComponent } from './connection-list.component';
import { of } from 'rxjs';

describe('ConnectionListComponent', () => {
  it('should create', () => {
    const mockConnectionService = {
      getConnections: mock(() => of([])),
      disconnectUser: mock()
    };
    const mockRouter = {
      navigate: mock()
    };
    const mockSnackBar = {
      open: mock()
    };

    const component = new ConnectionListComponent(
      mockConnectionService as any,
      mockRouter as any,
      mockSnackBar as any
    );

    expect(component).toBeTruthy();
  });
});
