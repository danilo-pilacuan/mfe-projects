import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ErrorDominio,
  ETIQUETA_ETAPA,
  EtapaTrabajo,
  ProjectStore,
  Proyecto,
  ProyectoResumen,
  SesionStore,
  evaluarGate,
  SESION_STORE,
} from '@projecthub/shared';
import { DataTable, DataTableColumn, GanttChart, IntlFormat, StageBadge } from '@projecthub/ui';
import { PermisosUi } from '../../permisos-ui';

interface FilaEtapa {
  [clave: string]: unknown;
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  responsable: string;
  avance: number;
  asignado: number;
  consumido: number;
  desviacion: number;
  excedido: boolean;
}

/**
 * Detalle de proyecto (docs/funcionalidades.md 2.4-2.7, 4.1-4.5, 5.4-5.5,
 * 3.5): ficha, etapas de trabajo con Gantt, presupuesto con desviacion,
 * gate de etapa, bitacora y transiciones del ciclo de vida.
 */
@Component({
  selector: 'app-proyecto-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, DataTableColumn, GanttChart, StageBadge, RouterLink],
  templateUrl: './proyecto-detalle.html',
  styleUrl: './proyecto-detalle.scss',
})
export class ProyectoDetalle {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ProjectStore);
  private readonly permisos = inject(PermisosUi);
  private readonly intl = inject(IntlFormat);
  private readonly sesion: SesionStore = inject(SESION_STORE);

  readonly proyectoId = signal('');
  readonly mensaje = signal<{ texto: string; tipo: 'info' | 'error' } | null>(null);

  readonly proyecto = computed<Proyecto | null>(() =>
    this.proyectoId() ? (this.store.proyectoPorId(this.proyectoId()) ?? null) : null,
  );

  readonly resumen = computed<ProyectoResumen | null>(() =>
    this.proyectoId() ? (this.store.resumen(this.proyectoId()) ?? null) : null,
  );

  readonly etapas = computed<readonly EtapaTrabajo[]>(() =>
    this.proyectoId() ? this.store.etapasDeProyecto(this.proyectoId()) : [],
  );

  readonly bitacora = computed(() =>
    this.proyectoId() ? this.store.bitacoraDeProyecto(this.proyectoId()) : [],
  );

  readonly entregables = computed(() =>
    this.proyectoId() ? this.store.entregablesDeProyecto(this.proyectoId()) : [],
  );

  readonly gate = computed(() => {
    const p = this.proyecto();
    if (!p) {
      return null;
    }
    return evaluarGate(p.etapa, this.entregables());
  });

  readonly transiciones = computed(() =>
    this.proyecto() ? this.permisos.transicionesHabilitadas(this.proyecto()!.id) : [],
  );

  readonly filasEtapas = computed<readonly FilaEtapa[]>(() =>
    this.etapas().map((e) => ({
      id: e.id,
      nombre: e.nombre,
      inicio: this.intl.fecha(e.fechaInicio),
      fin: this.intl.fecha(e.fechaFin),
      responsable: e.responsableId,
      avance: e.avance,
      asignado: e.presupuestoAsignado,
      consumido: e.presupuestoConsumido,
      desviacion: Math.round((e.presupuestoConsumido - e.presupuestoAsignado) * 100) / 100,
      excedido: e.presupuestoConsumido > e.presupuestoAsignado,
    })),
  );

  constructor() {
    this.proyectoId.set(this.ruta.snapshot.paramMap.get('id') ?? '');
  }

  protected monto(valor: number): string {
    return this.intl.monto(valor);
  }

  protected pct(valor: number): string {
    return this.intl.porcentaje(valor);
  }

  protected intlFecha(valor: string): string {
    return this.intl.fecha(valor);
  }

  protected etiquetaEtapa(valor: string): string {
    return ETIQUETA_ETAPA[valor as keyof typeof ETIQUETA_ETAPA] ?? valor;
  }

  protected avanzar(destino: string): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      return;
    }
    try {
      this.store.transicionar(this.proyectoId(), destino as never, actor);
      this.mensaje.set({ texto: 'Transicion registrada en la bitacora.', tipo: 'info' });
    } catch (e) {
      this.mensaje.set({ texto: this.textoError(e), tipo: 'error' });
    }
  }

  protected cancelar(): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      return;
    }
    const comentario = window.prompt('Motivo de la cancelacion (queda en la bitacora):') ?? '';
    try {
      this.store.cancelarProyecto(this.proyectoId(), actor, comentario);
      this.mensaje.set({ texto: 'Proyecto cancelado.', tipo: 'info' });
    } catch (e) {
      this.mensaje.set({ texto: this.textoError(e), tipo: 'error' });
    }
  }

  protected cerrar(): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      return;
    }
    const comentario = window.prompt('Comentario de cierre (queda en la bitacora):') ?? '';
    try {
      this.store.cerrarProyecto(this.proyectoId(), actor, comentario);
      this.mensaje.set({ texto: 'Proyecto cerrado.', tipo: 'info' });
    } catch (e) {
      this.mensaje.set({ texto: this.textoError(e), tipo: 'error' });
    }
  }

  protected registrarAvance(etapa: FilaEtapa): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      return;
    }
    const texto = window.prompt(`Nuevo avance para "${etapa.nombre}" (0-100):`);
    if (texto === null) {
      return;
    }
    try {
      this.store.registrarAvance(etapa.id, Number(texto), actor);
      this.mensaje.set({ texto: 'Avance registrado.', tipo: 'info' });
    } catch (e) {
      this.mensaje.set({ texto: this.textoError(e), tipo: 'error' });
    }
  }

  protected registrarConsumo(etapa: FilaEtapa): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      return;
    }
    const texto = window.prompt(`Consumo acumulado para "${etapa.nombre}" (COP):`);
    if (texto === null) {
      return;
    }
    try {
      this.store.registrarConsumo(etapa.id, Number(texto), actor);
      this.mensaje.set({ texto: 'Consumo registrado.', tipo: 'info' });
    } catch (e) {
      this.mensaje.set({ texto: this.textoError(e), tipo: 'error' });
    }
  }

  protected eliminarEtapa(etapa: FilaEtapa): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      return;
    }
    if (!window.confirm(`Eliminar la etapa "${etapa.nombre}"?`)) {
      return;
    }
    try {
      this.store.eliminarEtapa(etapa.id, actor);
      this.mensaje.set({ texto: 'Etapa eliminada.', tipo: 'info' });
    } catch (e) {
      this.mensaje.set({ texto: this.textoError(e), tipo: 'error' });
    }
  }

  protected volver(): void {
    void this.router.navigate(['/projects']);
  }

  private textoError(e: unknown): string {
    if (e instanceof ErrorDominio) {
      return e.message;
    }
    return 'No fue posible completar la operacion.';
  }
}
