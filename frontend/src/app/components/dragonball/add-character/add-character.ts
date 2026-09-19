import { Component, signal, output } from "@angular/core";
import { Character } from "../../../interfaces/character.interface";

@Component({
  selector: "dragonball-add-character",
  templateUrl: "./add-character.html",
})
export class AddCharacter {
    name = signal('');
    power = signal(0);
    characters = signal<Character[]>([]);

    newCharacter = output<Character>();

    addCharacter() {
        if(!this.name() || !this.power() || this.power() <= 0) {
            return;
        }
        const newCharacter: Character = {
            id: this.characters().length + 1,
            name: this.name(),
            power: this.power(),
        };
        //this.characters.update(characters => [...characters, newCharacter]);
        this.newCharacter.emit(newCharacter);
        this.resetFields();
    }

    resetFields() {
        this.name.set('');
        this.power.set(0);
    }
}