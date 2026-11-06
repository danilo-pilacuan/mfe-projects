import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ProjectStore, SESION_STORE, SesionStore } from '@projecthub/shared';
import { ProyectoForm } from './proyecto-form';

@Component({ template: '' })
class Vacia {}

describe('ProyectoForm', () => {
  function configurar(id?: string): ComponentFixture<ProyectoForm> {
    TestBed.configureTestingModule({
      imports: [ProyectoForm],
      providers: [
        provideRouter([
          { path: 'projects', component: Vacia },
          { path: 'projects/detalle/:id', component: Vacia },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
          },
        },
      ],
    });
    return TestBed.createComponent(ProyectoForm);
  }

  it('crea un proyecto con sesion activa; nace en Planteamiento y Activo', async () => {    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const c = fixture.componentInstance;
    c.nombre.set('Proyecto de prueba');
    c.descripcion.set('Alcance de prueba');
    c.presupuestoEstimado.set('50000');
    c.fechaObjetivo.set('2027-06-30');
    c.guardar();
    const store = TestBed.inject(ProjectStore);
    const creado = store.proyectos().find((p) => p.nombre === 'Proyecto de prueba');
    expect(creado).toBeDefined();
    expect(creado?.etapa).toBe('Planteamiento');
    expect(creado?.estado).toBe('Activo');
  });

  it('rechaza crear sin sesion activa', async () => {    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).cerrar();
    await fixture.whenStable();
    const c = fixture.componentInstance;
    c.nombre.set('Sin sesion');
    c.presupuestoEstimado.set('1000');
    c.fechaObjetivo.set('2027-01-01');
    c.guardar();
    const store = TestBed.inject(ProjectStore);
    expect(store.proyectos().some((p) => p.nombre === 'Sin sesion')).toBe(false);
    expect(c.error()).toContain('Seleccione un usuario');
    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
  });

  it('valida presupuesto negativo antes de llamar al store', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const c = fixture.componentInstance;
    c.nombre.set('Presupuesto malo');
    c.presupuestoEstimado.set('-5');
    c.fechaObjetivo.set('2027-01-01');
    c.guardar();
    const store = TestBed.inject(ProjectStore);
    expect(store.proyectos().some((p) => p.nombre === 'Presupuesto malo')).toBe(false);
    expect(c.error()).toContain('presupuesto');
  });

  it('carga datos del proyecto en modo edicion', async () => {
    const fixture = configurar('p2');

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    expect(fixture.componentInstance.editando()).toBe(true);
    expect(fixture.componentInstance.nombre()).toBe('Data warehouse corporativo');
  });

  it('muestra el banner de sesion requerida sin usuario activo', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).cerrar();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('ph-permission-banner')).not.toBeNull();
    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
  });
});
