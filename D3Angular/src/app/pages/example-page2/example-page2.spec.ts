import { TestBed } from '@angular/core/testing';
import { ExamplePage2Component } from './example-page2';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamplePage2Component],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(ExamplePage2Component);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'D3Angular' title`, () => {
    const fixture = TestBed.createComponent(ExamplePage2Component);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('D3Angular');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(ExamplePage2Component);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, D3Angular');
  });
});
