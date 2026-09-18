import { Component, computed, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';

@Component({
    templateUrl: './hero.html',
    imports: [UpperCasePipe]
})

export class Hero {
    name = signal('Iroman');
    age = signal(45);

    heroDescription = computed(() => {
        const description = `${this.name()} tiene ${this.age()} años.`;
        return description;
    });

    capitalizedHeroName = computed(() => {
        return this.name().toUpperCase();
    });

    getHeroDescription() {
        return `${this.name()} tiene ${this.age()} años.`;
    }

    changeHero() {
        this.name.set('Spiderman');
        this.age.set(22);
    }

    changeAge() {
        this.age.set(60);
    }

    resetForm() {
        this.name.set('Iroman');
        this.age.set(45);
    }
}