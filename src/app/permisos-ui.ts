import { Injectable, inject } from '@angular/core';
import {
  Accion,
  EtapaCicloVida,
  ProjectStore,
  SesionStore,
  tienePermiso,
  transicionesDisponibles,
  SESION_STORE,
} from '@projecthub/shared';

const ETAPAS_ORDEN: readonly EtapaCicloVida[] = [
  'Planteamiento',
  'Iniciativa',
  'PoC',
  'ValidacionPoC',
  'Planeacion',
  'Contratos',
  'Ejecucion',
  'Operacion',
  'Cierre',
];

function accionDeTransicion(origen: EtapaCicloVida, destino: EtapaCicloVida): Accion {
  return ETAPAS_ORDEN.indexOf(destino) > ETAPAS_ORDEN.indexOf(origen)
    ? 'avanzarEtapa'
    : 'retrocederEtapa';
}

/**
 * Fachada de permisos para la UI (docs/funcionalidades.md 1.7): consulta la
 * matriz con el usuario activo de la sesion. Los componentes ocultan acciones
 * con puede*(); el store vuelve a validar al ejecutar (defensa en profundidad).
 */
@Injectable({ providedIn: 'root' })
export class PermisosUi {
  private readonly sesion: SesionStore = inject(SESION_STORE);
  private readonly proyectos: ProjectStore = inject(ProjectStore);

  readonly usuarioActivo = this.sesion.usuarioActivo;
  readonly haySesion = this.sesion.haySesion;

  puedeEn(etapa: EtapaCicloVida, accion: Accion): boolean {
    const roles = this.sesion.rolesActivos();
    if (roles.length === 0) {
      return false;
    }
    return tienePermiso(etapa, accion, roles);
  }

  puedeEditarProyecto(proyectoId: string): boolean {
    const p = this.proyectos.proyectoPorId(proyectoId);
    return p ? this.puedeEn(p.etapa, 'editarProyecto') : false;
  }

  puedeCancelarProyecto(proyectoId: string): boolean {
    const p = this.proyectos.proyectoPorId(proyectoId);
    if (!p || p.estado !== 'Activo' || p.etapa === 'Cierre') {
      return false;
    }
    return this.puedeEn(p.etapa, 'cancelarProyecto');
  }

  puedeCerrarProyecto(proyectoId: string): boolean {
    const p = this.proyectos.proyectoPorId(proyectoId);
    if (!p || p.estado !== 'Activo' || p.etapa !== 'Cierre') {
      return false;
    }
    return this.puedeEn('Cierre', 'cerrarProyecto');
  }

  /** Transiciones habilitadas por grafo + permiso del rol activo. */
  transicionesHabilitadas(proyectoId: string): readonly EtapaCicloVida[] {
    const p = this.proyectos.proyectoPorId(proyectoId);
    if (!p || p.estado !== 'Activo') {
      return [];
    }
    return transicionesDisponibles(p.etapa).filter((destino) =>
      this.puedeEn(p.etapa, accionDeTransicion(p.etapa, destino)),
    );
  }

  puedeEditarEtapa(proyectoId: string): boolean {
    const p = this.proyectos.proyectoPorId(proyectoId);
    return p ? this.puedeEn(p.etapa, 'editarEtapaTrabajo') : false;
  }

  puedeRegistrarConsumo(proyectoId: string): boolean {
    const p = this.proyectos.proyectoPorId(proyectoId);
    return p ? this.puedeEn(p.etapa, 'registrarConsumo') : false;
  }

  puedeAprobarEntregable(proyectoId: string): boolean {
    const p = this.proyectos.proyectoPorId(proyectoId);
    return p ? this.puedeEn(p.etapa, 'aprobarEntregable') : false;
  }
}
