import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Profile } from '../../../core/models/profile';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrl: './profile-list.component.scss',
})
export class ProfileListComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'server',
    'port',
    'protocol',
    'isDefault',
    'actions',
  ];
  dataSource = new MatTableDataSource<Profile>([]);
  isLoading = true;
  error = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProfiles(): void {
    this.isLoading = true;
    this.error = '';

    this.profileService.getProfiles().subscribe({
      next: (profiles) => {
        this.dataSource.data = profiles;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profiles. Please try again later.';
        this.isLoading = false;
        console.error('Error loading profiles:', err);
      },
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewProfile(profileId: string): void {
    this.router.navigate(['/profiles', profileId]);
  }

  deleteProfile(profileId: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this profile?')) {
      this.profileService.deleteProfile(profileId).subscribe({
        next: () => {
          this.loadProfiles();
          this.snackBar.open('Profile deleted successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (err) => {
          this.snackBar.open('Failed to delete profile', 'Close', {
            duration: 3000,
          });
          console.error('Error deleting profile:', err);
        },
      });
    }
  }

  setDefaultProfile(profileId: string, event: Event): void {
    event.stopPropagation();

    this.profileService.setDefaultProfile(profileId).subscribe({
      next: () => {
        this.loadProfiles();
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

  refresh(): void {
    this.loadProfiles();
  }
}
