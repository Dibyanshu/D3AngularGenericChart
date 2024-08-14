import { TestBed } from '@angular/core/testing';
import { ExamplePage1Component } from './example-page1';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamplePage1Component],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(ExamplePage1Component);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'D3Angular' title`, () => {
    const fixture = TestBed.createComponent(ExamplePage1Component);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('D3Angular');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(ExamplePage1Component);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, D3Angular');
  });
});
