import { describe, it, expect, mock } from 'bun:test';
import { FormBuilder } from '@angular/forms';
import { UserDetailComponent } from './user-detail.component';

describe('UserDetailComponent', () => {
  it('should create', () => {
    const mockFormBuilder = new FormBuilder();
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: mock(() => 'new')
        }
      }
    };
    const mockRouter = {
      navigate: mock()
    };
    const mockUserService = {
      getUserById: mock(),
      createUser: mock(),
      updateUser: mock()
    };
    const mockConnectionService = {
      getConnectionsByUser: mock()
    };
    const mockSnackBar = {
      open: mock()
    };

    const component = new UserDetailComponent(
      mockFormBuilder,
      mockActivatedRoute as any,
      mockRouter as any,
      mockUserService as any,
      mockConnectionService as any,
      mockSnackBar as any
    );

    expect(component).toBeTruthy();
  });
});
