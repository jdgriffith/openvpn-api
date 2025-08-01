import { describe, it, expect, mock } from 'bun:test';
import { of } from 'rxjs';

import { ProfileListComponent } from './profile-list.component';
import { ProfileService } from '../../../core/services/profile.service';

describe('ProfileListComponent', () => {
  it('should create', () => {
    const mockProfileService = {
      getProfiles: mock(() => of([])),
      deleteProfile: mock(),
      setDefaultProfile: mock()
    };
    const mockRouter = {
      navigate: mock()
    };
    const mockSnackBar = {
      open: mock()
    };

    const component = new ProfileListComponent(
      mockProfileService as any,
      mockRouter as any,
      mockSnackBar as any
    );

    expect(component).toBeTruthy();
  });
});
