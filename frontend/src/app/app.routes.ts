import { Routes } from '@angular/router';
import { Counter } from './pages/counter/counter';
import { Hero } from './pages/hero/hero';
import { DragonBall } from './pages/dragonball/dragonball';
import { DragonBallSuper } from './pages/dragonball-super/dragonball-super';

export const routes: Routes = [
    {
        path: '', 
        component: Counter
    },
    {
        path: 'hero',
        component: Hero
    },
    {
        path: 'dragonball',
        component: DragonBall
    },
    {
        path: 'dragonball-super',
        component: DragonBallSuper
    },
    {
        path: '**',
        component: Counter
    },
];
