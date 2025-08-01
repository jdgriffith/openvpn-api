import { describe, it, expect } from 'bun:test';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create the app', () => {
    const component = new AppComponent();
    expect(component).toBeTruthy();
  });

  it(`should have the 'VPN Dashboard' title`, () => {
    const component = new AppComponent();
    expect(component.title).toEqual('VPN Dashboard');
  });
});
