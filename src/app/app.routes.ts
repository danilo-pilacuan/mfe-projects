import { Routes } from '@angular/router';
import { Portafolio } from './pages/portafolio/portafolio';
import { ProyectoDetalle } from './pages/proyecto-detalle/proyecto-detalle';
import { ProyectoForm } from './pages/proyecto-form/proyecto-form';

export const remoteRoutes: Routes = [
  { path: '', component: Portafolio },
  { path: 'nuevo', component: ProyectoForm },
  { path: 'detalle/:id', component: ProyectoDetalle },
  { path: 'editar/:id', component: ProyectoForm },
];
