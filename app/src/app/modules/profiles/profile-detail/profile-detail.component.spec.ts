import { describe, it, expect, mock } from 'bun:test';
import { FormBuilder } from '@angular/forms';
import { ProfileDetailComponent } from './profile-detail.component';

describe('ProfileDetailComponent', () => {
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
    const mockProfileService = {
      getProfileById: mock(),
      createProfile: mock(),
      updateProfile: mock(),
      setDefaultProfile: mock()
    };
    const mockSnackBar = {
      open: mock()
    };

    const component = new ProfileDetailComponent(
      mockFormBuilder,
      mockActivatedRoute as any,
      mockRouter as any,
      mockProfileService as any,
      mockSnackBar as any
    );

    expect(component).toBeTruthy();
  });
});
