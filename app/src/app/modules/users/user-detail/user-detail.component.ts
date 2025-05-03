import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../core/models/user';
import { UserService } from '../../../core/services/user.service';
import { ConnectionService } from '../../../core/services/connection.service';
import { Connection } from '../../../core/models/connection';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit {
  userId: string = '';
  user: User | null = null;
  userForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isNewUser = false;
  error = '';
  userConnections: Connection[] = [];
  isLoadingConnections = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private connectionService: ConnectionService,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.email]],
      fullName: [''],
      isActive: [true],
      role: ['user'],
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';

    if (this.userId === 'new') {
      this.isNewUser = true;
      this.isLoading = false;
    } else {
      this.loadUser();
      this.loadUserConnections();
    }
  }

  loadUser(): void {
    this.isLoading = true;
    this.error = '';

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.userForm.patchValue({
          username: user.username,
          email: user.email || '',
          fullName: user.fullName || '',
          isActive: user.isActive,
          role: user.role || 'user',
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user details. Please try again later.';
        this.isLoading = false;
        console.error('Error loading user:', err);
      },
    });
  }

  loadUserConnections(): void {
    this.isLoadingConnections = true;

    this.connectionService
      .getConnectionsByUser(this.userId)
      .pipe(
        catchError(() => {
          // If error, return empty array
          return of([]);
        })
      )
      .subscribe({
        next: (connections) => {
          this.userConnections = connections;
          this.isLoadingConnections = false;
        },
        error: () => {
          this.isLoadingConnections = false;
        },
      });
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      return;
    }

    this.isSaving = true;
    const userData: Partial<User> = this.userForm.value;

    const request = this.isNewUser
      ? this.userService.createUser(userData)
      : this.userService.updateUser(this.userId, userData);

    request.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: (user) => {
        this.snackBar.open(
          `User ${this.isNewUser ? 'created' : 'updated'} successfully`,
          'Close',
          {
            duration: 3000,
          }
        );

        if (this.isNewUser) {
          this.router.navigate(['/users', user.id]);
        } else {
          this.user = user;
        }
      },
      error: (err) => {
        this.snackBar.open(
          `Failed to ${this.isNewUser ? 'create' : 'update'} user`,
          'Close',
          {
            duration: 3000,
          }
        );
        console.error(
          `Error ${this.isNewUser ? 'creating' : 'updating'} user:`,
          err
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  viewConnection(connectionId: string): void {
    this.router.navigate(['/connections', connectionId]);
  }
}
