import { Component, signal } from "@angular/core";

@Component({
    templateUrl: './counter.html',
    styleUrl: './counter.css'
})
export class Counter {
    counter = 10;
    counterSignal = signal(10);

    increaseCounter (value: number) {
        this.counter += value;
        this.counterSignal.update((current) => current + value);
    }

    resetCounter() {
        this.counter = 10;
        this.counterSignal.set(0);
    }
}