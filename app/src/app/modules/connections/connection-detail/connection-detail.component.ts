import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Connection } from '../../../core/models/connection';
import { ConnectionService } from '../../../core/services/connection.service';
import { UserService } from '../../../core/services/user.service';
import { catchError, forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'app-connection-detail',
  templateUrl: './connection-detail.component.html',
  styleUrl: './connection-detail.component.scss',
})
export class ConnectionDetailComponent implements OnInit {
  connectionId: string = '';
  connection: Connection | null = null;
  username: string = '';
  isLoading = true;
  isDisconnecting = false;
  error = '';

  // Stats calculated from connection data
  bytesReceivedFormatted: string = '';
  bytesSentFormatted: string = '';
  totalBytesFormatted: string = '';
  durationFormatted: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private connectionService: ConnectionService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.connectionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadConnectionDetails();
  }

  loadConnectionDetails(): void {
    this.isLoading = true;
    this.error = '';

    this.connectionService
      .getConnectionById(this.connectionId)
      .pipe(
        map((connection) => {
          this.connection = connection;
          this.calculateStats();

          // Fetch the username for this connection
          return connection.userId;
        }),
        switchMap((userId) => {
          return this.userService.getUserById(userId).pipe(
            map((user) => user.username),
            catchError(() => of('Unknown User'))
          );
        }),
        catchError((err) => {
          this.error =
            'Failed to load connection details. Please try again later.';
          console.error('Error loading connection:', err);
          return of(null);
        })
      )
      .subscribe({
        next: (username) => {
          if (username) {
            this.username = username;
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  calculateStats(): void {
    if (this.connection) {
      // Format bytes received
      this.bytesReceivedFormatted = this.formatBytes(
        this.connection.bytesReceived
      );

      // Format bytes sent
      this.bytesSentFormatted = this.formatBytes(this.connection.bytesSent);

      // Calculate and format total bytes
      const totalBytes =
        this.connection.bytesReceived + this.connection.bytesSent;
      this.totalBytesFormatted = this.formatBytes(totalBytes);

      // Calculate and format duration
      const start = new Date(this.connection.connectedAt).getTime();
      const end = this.connection.disconnectedAt
        ? new Date(this.connection.disconnectedAt).getTime()
        : new Date().getTime();

      const durationInMs = end - start;
      this.durationFormatted = this.formatDuration(durationInMs);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  disconnectConnection(): void {
    if (!this.connection || this.connection.status !== 'active') {
      return;
    }

    if (confirm('Are you sure you want to disconnect this VPN connection?')) {
      this.isDisconnecting = true;

      this.connectionService
        .updateConnection(this.connectionId, {
          status: 'disconnected',
          disconnectedAt: new Date(),
        })
        .subscribe({
          next: (updatedConnection) => {
            this.connection = updatedConnection;
            this.calculateStats();
            this.isDisconnecting = false;
            this.snackBar.open(
              'Connection disconnected successfully',
              'Close',
              {
                duration: 3000,
              }
            );
          },
          error: (err) => {
            this.isDisconnecting = false;
            this.snackBar.open('Failed to disconnect connection', 'Close', {
              duration: 3000,
            });
            console.error('Error disconnecting connection:', err);
          },
        });
    }
  }

  viewUser(): void {
    if (this.connection) {
      this.router.navigate(['/users', this.connection.userId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/connections']);
  }
}
