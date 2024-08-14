import { Route, Routes } from '@angular/router';

// define route for each pages in the page folder
export const APP_ROUTES: Routes = [
    // add path for example-page1
    {
        path: 'example-page1',
        loadComponent: () => import('./pages/example-page1/example-page1').then(m => m.ExamplePage1Component)
    }
];
