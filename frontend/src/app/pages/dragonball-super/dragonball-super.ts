import { Component, computed, inject, signal } from '@angular/core';
import { CharaterList} from '../../components/dragonball/charater-list/charater-list';
import { AddCharacter } from '../../components/dragonball/add-character/add-character';
import { DragonBallService } from '../../services/dragonball.service';

@Component({
  templateUrl: './dragonball-super.html',
  imports: [CharaterList, AddCharacter],
  selector: 'app-dragonball-super',
})

export class DragonBallSuper {
    public dragonBallService = inject(DragonBallService);
}