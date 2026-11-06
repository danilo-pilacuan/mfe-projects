import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  EstadoProyecto,
  ETAPAS_CICLO_VIDA,
  ETIQUETA_ETAPA,
  ETIQUETA_ESTADO,
  ProyectoResumen,
  ProjectStore,
} from '@projecthub/shared';
import { DataTable, DataTableColumn, IntlFormat, StageBadge } from '@projecthub/ui';
import { PermisosUi } from '../../permisos-ui';

interface FilaPortafolio {
  [clave: string]: unknown;
  id: string;
  nombre: string;
  patrocinador: string;
  etapaValor: string;
  estadoValor: string;
  avance: number;
  presupuesto: number;
  excedido: boolean;
}

/**
 * Portafolio de proyectos (docs/funcionalidades.md 2.2-2.3): tabla con
 * filtros por etapa/estado y busqueda por nombre parcial e insensible a
 * mayusculas. El avance es el calculado por el store (4.4), nunca editable.
 */
@Component({
  selector: 'app-portafolio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, DataTableColumn, StageBadge, RouterLink],
  templateUrl: './portafolio.html',
  styleUrl: './portafolio.scss',
})
export class Portafolio {
  private readonly store = inject(ProjectStore);
  private readonly permisos = inject(PermisosUi);
  private readonly intl = inject(IntlFormat);
  private readonly router = inject(Router);

  readonly etapas = ETAPAS_CICLO_VIDA;
  readonly etiquetaEtapa = ETIQUETA_ETAPA;
  readonly estados: readonly EstadoProyecto[] = ['Activo', 'Cancelado', 'Cerrado'];
  readonly etiquetaEstado = ETIQUETA_ESTADO;

  readonly filtroEtapa = signal<string>('todas');
  readonly filtroEstado = signal<string>('todos');
  readonly busqueda = signal('');

  readonly puedeCrear = computed(() => this.permisos.haySesion());

  readonly filas = computed<readonly FilaPortafolio[]>(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const etapa = this.filtroEtapa();
    const estado = this.filtroEstado();
    return this.store
      .resumenes()
      .filter((r) => (etapa === 'todas' ? true : r.proyecto.etapa === etapa))
      .filter((r) => (estado === 'todos' ? true : r.proyecto.estado === estado))
      .filter((r) => (termino ? r.proyecto.nombre.toLowerCase().includes(termino) : true))
      .map((r) => this.aFila(r));
  });

  private aFila(r: ProyectoResumen): FilaPortafolio {
    return {
      id: r.proyecto.id,
      nombre: r.proyecto.nombre,
      patrocinador: r.proyecto.patrocinadorId,
      etapaValor: r.proyecto.etapa,
      estadoValor: r.proyecto.estado,
      avance: r.avance,
      presupuesto: r.presupuestoAsignado,
      excedido: r.excedido,
    };
  }

  protected monto(valor: number): string {
    return this.intl.monto(valor);
  }

  protected pct(valor: number): string {
    return this.intl.porcentaje(valor);
  }

  protected abrir(id: string): void {
    void this.router.navigate(['/projects', 'detalle', id]);
  }
}
