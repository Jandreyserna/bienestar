import { Component, computed, signal } from '@angular/core';
import { CharaterList} from '../../components/dragonball/charater-list/charater-list';
import { AddCharacter } from '../../components/dragonball/add-character/add-character';
import { Character } from '../../interfaces/character.interface';

@Component({
  templateUrl: './dragonball-super.html',
  imports: [CharaterList, AddCharacter],
  selector: 'app-dragonball-super',
})

export class DragonBallSuper {
    characters = signal<Character[]>([
        {id: 1, name: 'Goku', power: 9001},
    ]);

    addCharacter(newCharacter: Character) {
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