import { describe, it, expect, mock } from 'bun:test';
import { ConnectionDetailComponent } from './connection-detail.component';

describe('ConnectionDetailComponent', () => {
  it('should create', () => {
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: mock(() => '123')
        }
      }
    };
    const mockRouter = {
      navigate: mock()
    };
    const mockConnectionService = {
      getConnectionById: mock(),
      disconnectUser: mock()
    };
    const mockUserService = {
      getUserById: mock()
    };
    const mockSnackBar = {
      open: mock()
    };

    const component = new ConnectionDetailComponent(
      mockActivatedRoute as any,
      mockRouter as any,
      mockConnectionService as any,
      mockUserService as any,
      mockSnackBar as any
    );

    expect(component).toBeTruthy();
  });
});
