import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-projects-root',
  standalone: true,
  template: `<h1>Proyectos</h1><p>Portafolio de proyectos (fase 4).</p>`,
})
export class PlaceholderComponent {}

export const remoteRoutes: Routes = [
  { path: '', component: PlaceholderComponent },
];
