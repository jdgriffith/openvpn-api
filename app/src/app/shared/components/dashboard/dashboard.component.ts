import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../../core/services/user.service';
import { ConnectionService } from '../../../core/services/connection.service';
import { ProfileService } from '../../../core/services/profile.service';
import { User } from '../../../core/models/user';
import { Connection } from '../../../core/models/connection';
import { Profile } from '../../../core/models/profile';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  userCount = 0;
  activeUsersCount = 0;
  connectionsCount = 0;
  activeConnectionsCount = 0;
  profilesCount = 0;
  recentConnections: Connection[] = [];
  error = '';

  constructor(
    private userService: UserService,
    private connectionService: ConnectionService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = '';

    forkJoin({
      users: this.userService.getUsers().pipe(catchError(() => of([]))),
      connections: this.connectionService
        .getConnections()
        .pipe(catchError(() => of([]))),
      activeConnections: this.connectionService
        .getActiveConnections()
        .pipe(catchError(() => of([]))),
      profiles: this.profileService
        .getProfiles()
        .pipe(catchError(() => of([]))),
    })
      .pipe(
        map((result) => {
          this.userCount = result.users.length;
          this.activeUsersCount = result.users.filter(
            (user) => user.isActive
          ).length;
          this.connectionsCount = result.connections.length;
          this.activeConnectionsCount = result.activeConnections.length;
          this.profilesCount = result.profiles.length;

          // Get 5 most recent connections
          this.recentConnections = [...result.connections]
            .sort(
              (a, b) =>
                new Date(b.connectedAt).getTime() -
                new Date(a.connectedAt).getTime()
            )
            .slice(0, 5);

          return result;
        }),
        catchError((err) => {
          this.error =
            'An error occurred while loading dashboard data. Please try again later.';
          console.error('Dashboard loading error:', err);
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  refresh(): void {
    this.loadDashboardData();
  }
}
