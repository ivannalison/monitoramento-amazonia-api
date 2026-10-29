import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

@Component({
  imports: [ModalComponent],
  template: `<guarda-modal titulo="Teste" [aberto]="aberto" (fechar)="fechou = true">conteudo do modal</guarda-modal>`,
})
class HospedeiroModal {
  aberto = false;
  fechou = false;
}

describe('ModalComponent', () => {
  it('mostra o conteudo so quando aberto e emite fechar', () => {
    const fixture = TestBed.createComponent(HospedeiroModal);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.modal')).toBeNull();
    fixture.componentInstance.aberto = true;
    fixture.detectChanges();
    expect(el.querySelector('.modal')).not.toBeNull();
    (el.querySelector('button.x') as HTMLButtonElement).click();
    expect(fixture.componentInstance.fechou).toBeTrue();
  });
});