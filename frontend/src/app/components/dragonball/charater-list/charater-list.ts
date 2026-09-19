import { Component, input } from '@angular/core';
import { Character } from '../../../interfaces/character.interface';

@Component({
  selector: 'dragonball-charater-list',
  imports: [],
  templateUrl: './charater-list.html',
})
export class CharaterList {
  characters = input.required<Character[]>();
  listadoName = input.required<string>();
}
