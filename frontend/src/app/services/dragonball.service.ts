import { effect, Injectable, signal } from '@angular/core';
import { Character } from '../interfaces/character.interface';

const loadCharactersFromLocalStorage = (): Character[] => {
    const characters = localStorage.getItem('dragonball-characters');
    return characters ? JSON.parse(characters) : [];
}

@Injectable({
  providedIn: 'root'
})
export class DragonBallService {
    characters = signal<Character[]>(loadCharactersFromLocalStorage());

    saveToLocalStorage = effect(() => {
        localStorage.setItem('dragonball-characters', JSON.stringify(this.characters()));
    });

    addCharacter(newCharacter: Character) {
        this.characters.update(characters => [...characters, newCharacter]);
    }
}
