import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SESION_STORE, SesionStore } from '@projecthub/shared';
import { ProyectoDetalle } from './proyecto-detalle';

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
});
