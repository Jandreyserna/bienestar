import { Component, computed, signal } from '@angular/core';

interface Character {
    id: number;
    name: string;
    power: number;
}

@Component({
  templateUrl: './dragonball.html',
})

export class DragonBall {
    name = signal('Goku');
    power = signal(9001);

    characters = signal<Character[]>([
        {id: 1, name: 'Goku', power: 9001},
        {id: 2, name: 'Vegeta', power: 8500},
        {id: 3, name: 'Gohan', power: 7000},
        {id: 4, name: 'Piccolo', power: 6500},
        {id: 5, name: 'yamcha', power: 500},
    ]);

    addCharacter() {
        const newCharacter: Character = {
            id: this.characters().length + 1,
            name: this.name(),
            power: this.power(),
        };
        this.characters.update(characters => [...characters, newCharacter]);
    }

    /* powerClasses = computed(() => {
        return this.characters().map(character => {
            if (character.power > 9000) {
                return 'text-success';
            } else if (character.power > 6000) {
                return 'text-warning';
            } else {
                return 'text-danger';
            }
        });
    }); */
}