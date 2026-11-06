import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectSummaryWidget } from './project-summary.widget';

@Component({
  selector: 'test-host',
  imports: [ProjectSummaryWidget],
  template: `<ph-project-summary-widget [proyectoId]="id()" />`,
})
class TestHost {
  readonly id = signal('p1');
}

describe('ProjectSummaryWidget', () => {
  it('muestra avance y presupuesto del proyecto', async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Portal de pagos');
    expect(texto).toContain('%');
    expect(texto).toContain('de');
  });

  it('muestra estado vacio para un proyecto inexistente', async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.id.set('no-existe');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Proyecto no disponible');
  });
});
