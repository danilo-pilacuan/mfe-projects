import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SESION_STORE, SesionStore } from '@projecthub/shared';
import { Portafolio } from './portafolio';

describe('Portafolio', () => {
  function configurar(): ReturnType<typeof TestBed.createComponent<Portafolio>> {
    TestBed.configureTestingModule({
      imports: [Portafolio],
      providers: [provideRouter([])],
    });
    return TestBed.createComponent(Portafolio);
  }

  it('muestra los proyectos de la semilla con etapa y estado', async () => {    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Portal de pagos');
    expect(texto).toContain('Data warehouse corporativo');
    expect(texto).toContain('Ejecucion');
  });

  it('filtra por estado Cancelado', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    fixture.componentInstance.filtroEstado.set('Cancelado');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Modernizacion legado');
    expect(texto).not.toContain('Portal de pagos');
  });

  it('filtra por etapa Planeacion', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    fixture.componentInstance.filtroEtapa.set('Planeacion');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Data warehouse corporativo');
    expect(texto).not.toContain('App movil de field service');
  });

  it('busca por nombre parcial sin distinguir mayusculas', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    fixture.componentInstance.busqueda.set('data');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Data warehouse corporativo');
    expect(texto).not.toContain('Portal de pagos');
  });

  it('muestra mensaje vacio cuando ningun proyecto coincide', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    fixture.componentInstance.busqueda.set('zzz-inexistente');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sin proyectos');
  });

  it('oculta el boton nuevo proyecto sin sesion activa', async () => {    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).cerrar();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.boton.primario')).toBeNull();
    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
  });
});
