import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../core/models/user';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = [
    'username',
    'email',
    'isActive',
    'lastLoginAt',
    'actions',
  ];
  dataSource = new MatTableDataSource<User>([]);
  isLoading = true;
  error = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = '';

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users. Please try again later.';
        this.isLoading = false;
        console.error('Error loading users:', err);
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

  viewUser(userId: string): void {
    this.router.navigate(['/users', userId]);
  }

  deleteUser(userId: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open('User deleted successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (err) => {
          this.snackBar.open('Failed to delete user', 'Close', {
            duration: 3000,
          });
          console.error('Error deleting user:', err);
        },
      });
    }
  }

  toggleUserStatus(user: User, event: Event): void {
    event.stopPropagation();

    const updatedUser = {
      ...user,
      isActive: !user.isActive,
    };

    this.userService
      .updateUser(user.id, { isActive: !user.isActive })
      .subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open(
            `User ${
              updatedUser.isActive ? 'activated' : 'deactivated'
            } successfully`,
            'Close',
            {
              duration: 3000,
            }
          );
        },
        error: (err) => {
          this.snackBar.open('Failed to update user status', 'Close', {
            duration: 3000,
          });
          console.error('Error updating user status:', err);
        },
      });
  }

  refresh(): void {
    this.loadUsers();
  }
}
