import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Connection } from '../../../core/models/connection';
import { ConnectionService } from '../../../core/services/connection.service';

@Component({
  selector: 'app-connection-list',
  templateUrl: './connection-list.component.html',
  styleUrl: './connection-list.component.scss',
})
export class ConnectionListComponent implements OnInit {
  displayedColumns: string[] = [
    'ipAddress',
    'userId',
    'connectedAt',
    'duration',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<Connection>([]);
  isLoading = true;
  error = '';
  activeFilter: 'all' | 'active' | 'disconnected' = 'all';
  totalActiveConnections = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private connectionService: ConnectionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadConnections();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadConnections(): void {
    this.isLoading = true;
    this.error = '';

    this.connectionService.getConnections().subscribe({
      next: (connections) => {
        this.totalActiveConnections = connections.filter(
          (c) => c.status === 'active'
        ).length;

        if (this.activeFilter === 'all') {
          this.dataSource.data = connections;
        } else if (this.activeFilter === 'active') {
          this.dataSource.data = connections.filter(
            (c) => c.status === 'active'
          );
        } else {
          this.dataSource.data = connections.filter(
            (c) => c.status === 'disconnected'
          );
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load connections. Please try again later.';
        this.isLoading = false;
        console.error('Error loading connections:', err);
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

  viewConnection(connectionId: string): void {
    this.router.navigate(['/connections', connectionId]);
  }

  disconnectConnection(connectionId: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to disconnect this connection?')) {
      // In a real app, you'd call a service method to disconnect the connection
      // For now, we'll simulate it with an update to set status to 'disconnected'
      const disconnectedAt = new Date();

      this.connectionService
        .updateConnection(connectionId, {
          status: 'disconnected',
          disconnectedAt,
        })
        .subscribe({
          next: () => {
            this.loadConnections();
            this.snackBar.open(
              'Connection disconnected successfully',
              'Close',
              {
                duration: 3000,
              }
            );
          },
          error: (err) => {
            this.snackBar.open('Failed to disconnect connection', 'Close', {
              duration: 3000,
            });
            console.error('Error disconnecting connection:', err);
          },
        });
    }
  }

  deleteConnection(connectionId: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this connection record?')) {
      this.connectionService.deleteConnection(connectionId).subscribe({
        next: () => {
          this.loadConnections();
          this.snackBar.open(
            'Connection record deleted successfully',
            'Close',
            {
              duration: 3000,
            }
          );
        },
        error: (err) => {
          this.snackBar.open('Failed to delete connection record', 'Close', {
            duration: 3000,
          });
          console.error('Error deleting connection:', err);
        },
      });
    }
  }

  filterConnections(filter: 'all' | 'active' | 'disconnected'): void {
    this.activeFilter = filter;
    this.loadConnections();
  }

  calculateDuration(connection: Connection): string {
    const start = new Date(connection.connectedAt).getTime();
    const end = connection.disconnectedAt
      ? new Date(connection.disconnectedAt).getTime()
      : new Date().getTime();

    const durationInMs = end - start;
    const seconds = Math.floor(durationInMs / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  refresh(): void {
    this.loadConnections();
  }
}
