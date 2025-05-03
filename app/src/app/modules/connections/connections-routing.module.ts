import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnectionListComponent } from './connection-list/connection-list.component';
import { ConnectionDetailComponent } from './connection-detail/connection-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ConnectionListComponent,
  },
  {
    path: ':id',
    component: ConnectionDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConnectionsRoutingModule {}
