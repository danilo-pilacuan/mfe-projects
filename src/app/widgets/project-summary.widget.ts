import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ProjectStore } from '@projecthub/shared';
import { IntlFormat, SummaryTendencia, SummaryWidget } from '@projecthub/ui';

/**
 * ProjectSummaryWidget (docs/funcionalidades.md 8.5): widget federado que
 * expone mfe-projects para el dashboard del shell y para mfe-reports
 * (consumo remote a remote). Entrada: id del proyecto.
 */
@Component({
  selector: 'ph-project-summary-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SummaryWidget],
  template: `
    @if (datos(); as d) {
      <ph-summary-widget
        [titulo]="d.titulo"
        [valor]="d.valor"
        [detalle]="d.detalle"
        [tendencia]="d.tendencia"
      />
    } @else {
      <p class="widget-vacio">Proyecto no disponible.</p>
    }
  `,
  styles: `
    .widget-vacio {
      margin: 0;
      padding: 0.75rem;
      color: var(--ph-texto-suave, #5b6472);
      font-size: 0.875rem;
    }
  `,
})
export class ProjectSummaryWidget {
  private readonly store = inject(ProjectStore);
  private readonly intl = inject(IntlFormat);

  /** Id del proyecto a resumir. */
  readonly proyectoId = input.required<string>();

  readonly datos = computed(() => {
    const r = this.store.resumen(this.proyectoId());
    if (!r) {
      return null;
    }
    const tendencia: SummaryTendencia =
      r.desviacion > 0 ? 'negativa' : r.desviacion < 0 ? 'positiva' : 'neutra';
    return {
      titulo: r.proyecto.nombre,
      valor: this.intl.porcentaje(r.avance),
      detalle: `${this.intl.monto(r.presupuestoConsumido)} de ${this.intl.monto(
        r.presupuestoAsignado,
      )}`,
      tendencia,
    };
  });
}
