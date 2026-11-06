import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { EtapaTrabajo, ProjectStore, SESION_STORE, SesionStore } from '@projecthub/shared';
import { ProyectoDetalle } from './proyecto-detalle';

/** Acceso tipado a los miembros protegidos que usa el formulario de etapas. */
interface ApiFormEtapa {
  abrirNuevaEtapa(): void;
  abrirEdicionEtapa(etapa: EtapaTrabajo): void;
  guardarEtapa(): void;
  formEtapaVisible: WritableSignal<boolean>;
  etapaEditandoId: WritableSignal<string | null>;
  etapaNombre: WritableSignal<string>;
  etapaFechaInicio: WritableSignal<string>;
  etapaFechaFin: WritableSignal<string>;
  etapaResponsableId: WritableSignal<string>;
  etapaPresupuesto: WritableSignal<string>;
  etapaError: WritableSignal<string>;
}

function api(fixture: ComponentFixture<ProyectoDetalle>): ApiFormEtapa {
  return fixture.componentInstance as unknown as ApiFormEtapa;
}

describe('ProyectoDetalle', () => {
  function configurar(proyectoId: string): ComponentFixture<ProyectoDetalle> {
    TestBed.configureTestingModule({
      imports: [ProyectoDetalle],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: proyectoId }) },
          },
        },
      ],
    });
    return TestBed.createComponent(ProyectoDetalle);
  }

  it('muestra la ficha del proyecto p1 con etapa Ejecucion', async () => {    const fixture = configurar('p1');

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Portal de pagos');
    expect(texto).toContain('Ejecucion');
  });

  it('muestra las etapas de trabajo y el Gantt', async () => {
    const fixture = configurar('p1');

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const texto = el.textContent ?? '';
    expect(texto).toContain('Etapas de trabajo');
    expect(texto).toContain('Sprint 0 - cimientos');
    expect(el.querySelector('ph-gantt-chart')).not.toBeNull();
  });

  it('muestra el gate con entregable pendiente de aprobacion en p1', async () => {
    const fixture = configurar('p1');

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Pendiente de aprobacion');
  });

  it('muestra las tarjetas de presupuesto con desviacion', async () => {
    const fixture = configurar('p1');

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Presupuesto asignado');
    expect(texto).toContain('Desviacion de presupuesto');
  });

  it('muestra la bitacora del proyecto', async () => {
    const fixture = configurar('p1');

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Bitacora');
    expect(texto).toContain('Contrato firmado.');
  });

  it('muestra estado vacio para un proyecto inexistente', async () => {
    const fixture = configurar('no-existe');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Proyecto no encontrado');
  });

  it('oculta acciones de transicion sin sesion activa', async () => {    const fixture = configurar('p1');

    TestBed.inject<SesionStore>(SESION_STORE).cerrar();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.acciones .boton')).toBeNull();
    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
  });

  it('crea una etapa de trabajo desde el formulario (4.1)', async () => {
    const fixture = configurar('p1');
    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    const c = api(fixture);
    c.abrirNuevaEtapa();
    c.etapaNombre.set('Sprint 1 - pagos');
    c.etapaFechaInicio.set('2027-03-01');
    c.etapaFechaFin.set('2027-03-31');
    c.etapaResponsableId.set('u-pm');
    c.etapaPresupuesto.set('5000000');
    c.guardarEtapa();
    await fixture.whenStable();

    const store = TestBed.inject(ProjectStore);
    const creada = store.etapasDeProyecto('p1').find((e) => e.nombre === 'Sprint 1 - pagos');
    expect(creada).toBeDefined();
    expect(creada?.presupuestoAsignado).toBe(5000000);
    expect(creada?.avance).toBe(0);
    expect(c.formEtapaVisible()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Etapa creada.');
  });

  it('edita una etapa existente desde el formulario (4.2)', async () => {
    const fixture = configurar('p1');
    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    const store = TestBed.inject(ProjectStore);
    const original = store.etapasDeProyecto('p1')[0];
    const c = api(fixture);
    c.abrirEdicionEtapa(original);
    expect(c.etapaEditandoId()).toBe(original.id);
    c.etapaNombre.set('Sprint 0 - cimientos v2');
    c.etapaPresupuesto.set('9000000');
    c.guardarEtapa();
    await fixture.whenStable();

    const editada = store.etapasDeProyecto('p1').find((e) => e.id === original.id);
    expect(editada?.nombre).toBe('Sprint 0 - cimientos v2');
    expect(editada?.presupuestoAsignado).toBe(9000000);
    expect(editada?.presupuestoConsumido).toBe(original.presupuestoConsumido);
    expect(c.formEtapaVisible()).toBe(false);
  });

  it('rechaza una etapa con fecha fin anterior a la fecha inicio (4.5)', async () => {
    const fixture = configurar('p1');
    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    const c = api(fixture);
    c.abrirNuevaEtapa();
    c.etapaNombre.set('Etapa invalida');
    c.etapaFechaInicio.set('2027-03-31');
    c.etapaFechaFin.set('2027-03-01');
    c.etapaResponsableId.set('u-pm');
    c.etapaPresupuesto.set('1000000');
    c.guardarEtapa();

    const store = TestBed.inject(ProjectStore);
    expect(store.etapasDeProyecto('p1').some((e) => e.nombre === 'Etapa invalida')).toBe(false);
    expect(c.formEtapaVisible()).toBe(true);
    expect(c.etapaError()).toContain('fecha de fin no puede ser anterior');
  });

  it('no guarda etapas sin sesion activa', async () => {
    const fixture = configurar('p1');
    TestBed.inject<SesionStore>(SESION_STORE).cerrar();
    await fixture.whenStable();

    const c = api(fixture);
    c.abrirNuevaEtapa();
    expect(c.formEtapaVisible()).toBe(false);

    const store = TestBed.inject(ProjectStore);
    const total = store.etapasDeProyecto('p1').length;
    c.etapaNombre.set('Fantasma');
    c.guardarEtapa();
    expect(store.etapasDeProyecto('p1').length).toBe(total);
  });
});
