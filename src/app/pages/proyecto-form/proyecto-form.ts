import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ErrorDominio,
  ProjectStore,
  Proyecto,
  SesionStore,
  SESION_STORE,
} from '@projecthub/shared';
import { FormField, PermissionBanner } from '@projecthub/ui';
import { PermisosUi } from '../../permisos-ui';

/**
 * Creacion (2.1) y edicion (2.5) de proyecto. La creacion nace en
 * Planteamiento/Activo; la edicion solo cambia nombre, descripcion y fecha
 * objetivo. El store valida permisos, unicidad y bitacora.
 */
@Component({
  selector: 'app-proyecto-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, PermissionBanner],
  templateUrl: './proyecto-form.html',
  styleUrl: './proyecto-form.scss',
})
export class ProyectoForm {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ProjectStore);
  private readonly permisos = inject(PermisosUi);
  private readonly sesion: SesionStore = inject(SESION_STORE);

  readonly editando = signal(false);
  readonly proyectoId = signal('');
  readonly nombre = signal('');
  readonly descripcion = signal('');
  readonly presupuestoEstimado = signal('');
  readonly fechaObjetivo = signal('');
  readonly error = signal('');

  readonly usuarios = computed(() => this.sesion.usuariosActivos());

  readonly puedeGuardar = computed(() => {
    if (!this.permisos.haySesion()) {
      return false;
    }
    if (!this.editando()) {
      return true;
    }
    return this.permisos.puedeEditarProyecto(this.proyectoId());
  });

  constructor() {
    const id = this.ruta.snapshot.paramMap.get('id');
    if (id) {
      const p: Proyecto | undefined = this.store.proyectoPorId(id);
      if (p) {
        this.editando.set(true);
        this.proyectoId.set(id);
        this.nombre.set(p.nombre);
        this.descripcion.set(p.descripcion);
        this.presupuestoEstimado.set(String(p.presupuestoEstimado));
        this.fechaObjetivo.set(p.fechaObjetivo);
      }
    }
  }

  guardar(): void {
    this.error.set('');
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      this.error.set('Seleccione un usuario en el shell para continuar.');
      return;
    }
    const nombre = this.nombre().trim();
    if (!nombre) {
      this.error.set('El nombre del proyecto es obligatorio.');
      return;
    }
    const presupuesto = Number(this.presupuestoEstimado());
    if (!Number.isFinite(presupuesto) || presupuesto < 0) {
      this.error.set('El presupuesto estimado debe ser un numero mayor o igual a cero.');
      return;
    }
    if (!this.fechaObjetivo()) {
      this.error.set('La fecha objetivo es obligatoria.');
      return;
    }
    try {
      if (this.editando()) {
        this.store.editarProyecto(
          this.proyectoId(),
          {
            nombre,
            descripcion: this.descripcion().trim(),
            fechaObjetivo: this.fechaObjetivo(),
          },
          actor,
        );
        void this.router.navigate(['/projects', 'detalle', this.proyectoId()]);
      } else {
        const creado = this.store.crearProyecto(
          {
            nombre,
            descripcion: this.descripcion().trim(),
            patrocinadorId: actor.id,
            presupuestoEstimado: presupuesto,
            fechaObjetivo: this.fechaObjetivo(),
          },
          actor,
        );
        void this.router.navigate(['/projects', 'detalle', creado.id]);
      }
    } catch (e) {
      this.error.set(
        e instanceof ErrorDominio ? e.message : 'No fue posible guardar el proyecto.',
      );
    }
  }

  protected cancelar(): void {
    if (this.editando()) {
      void this.router.navigate(['/projects', 'detalle', this.proyectoId()]);
    } else {
      void this.router.navigate(['/projects']);
    }
  }
}
