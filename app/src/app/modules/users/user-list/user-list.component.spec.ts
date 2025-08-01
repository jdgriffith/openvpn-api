import { describe, it, expect, mock } from 'bun:test';
import { UserListComponent } from './user-list.component';
import { of } from 'rxjs';

describe('UserListComponent', () => {
  it('should create', () => {
    const mockUserService = {
      getUsers: mock(() => of([])),
      deleteUser: mock()
    };
    const mockRouter = {
      navigate: mock()
    };
    const mockSnackBar = {
      open: mock()
    };

    const component = new UserListComponent(
      mockUserService as any,
      mockRouter as any,
      mockSnackBar as any
    );

    expect(component).toBeTruthy();
  });
});
