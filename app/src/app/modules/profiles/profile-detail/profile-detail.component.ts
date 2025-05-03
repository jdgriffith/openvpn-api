import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Profile } from '../../../core/models/profile';
import { ProfileService } from '../../../core/services/profile.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrl: './profile-detail.component.scss',
})
export class ProfileDetailComponent implements OnInit {
  profileId: string = '';
  profile: Profile | null = null;
  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isNewProfile = false;
  error = '';
  protocols = ['udp', 'tcp', 'tcp-client', 'udp6', 'tcp6'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      server: ['', [Validators.required]],
      port: [
        1194,
        [Validators.required, Validators.min(1), Validators.max(65535)],
      ],
      protocol: ['udp', [Validators.required]],
      cipher: ['AES-256-CBC'],
      ca: [''],
      cert: [''],
      key: [''],
      tlsAuth: [''],
      compLzo: [true],
      isDefault: [false],
    });
  }

  ngOnInit(): void {
    this.profileId = this.route.snapshot.paramMap.get('id') || '';

    if (this.profileId === 'new') {
      this.isNewProfile = true;
      this.isLoading = false;
    } else {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.isLoading = true;
    this.error = '';

    this.profileService.getProfileById(this.profileId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileForm.patchValue({
          name: profile.name,
          server: profile.server,
          port: profile.port,
          protocol: profile.protocol,
          cipher: profile.cipher || 'AES-256-CBC',
          ca: profile.ca || '',
          cert: profile.cert || '',
          key: profile.key || '',
          tlsAuth: profile.tlsAuth || '',
          compLzo: profile.compLzo !== undefined ? profile.compLzo : true,
          isDefault: profile.isDefault || false,
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile details. Please try again later.';
        this.isLoading = false;
        console.error('Error loading profile:', err);
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isSaving = true;
    const profileData: Partial<Profile> = this.profileForm.value;

    const request = this.isNewProfile
      ? this.profileService.createProfile(profileData)
      : this.profileService.updateProfile(this.profileId, profileData);

    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: (profile) => {
        this.snackBar.open(
          `Profile ${this.isNewProfile ? 'created' : 'updated'} successfully`,
          'Close',
          {
            duration: 3000,
          }
        );

        // If this is marked as default, we don't need to do anything extra since
        // the API should handle setting it as default and updating other profiles

        if (this.isNewProfile) {
          this.router.navigate(['/profiles', profile.id]);
        } else {
          this.profile = profile;
        }
      },
      error: (err) => {
        this.snackBar.open(
          `Failed to ${this.isNewProfile ? 'create' : 'update'} profile`,
          'Close',
          {
            duration: 3000,
          }
        );
        console.error(
          `Error ${this.isNewProfile ? 'creating' : 'updating'} profile:`,
          err
        );
      },
    });
  }

  setAsDefault(): void {
    if (this.isNewProfile || !this.profile) {
      return;
    }

    this.profileService.setDefaultProfile(this.profileId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileForm.patchValue({ isDefault: true });
        this.snackBar.open('Default profile updated successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.snackBar.open('Failed to update default profile', 'Close', {
          duration: 3000,
        });
        console.error('Error updating default profile:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/profiles']);
  }
}
