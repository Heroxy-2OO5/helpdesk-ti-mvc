import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { App } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('debe crear la aplicación', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debe contener el router outlet principal', () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('router-outlet'),
    ).toBeTruthy();
  });
});