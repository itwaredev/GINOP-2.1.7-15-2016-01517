import { Injectable } from '@angular/core';
import { Observable, Observer, Subscription } from 'rxjs';
import { share } from 'rxjs/operators';

export class LoadingStateChanged {
  public id: string;
  public state: LoadingState;
  public progress: number;
  public allInProgress: number;
  public message: string;
  public callback: Function;

  constructor(id: string, state: LoadingState, progress: number, allInProgress: number, message?: string, callback?: Function) {
    this.id = id;
    this.state = state;
    this.progress = progress;
    this.allInProgress = allInProgress;
    this.message = message;
    this.callback = callback;
  }
}

enum LoadingState {
  STARTED = 0,
  INPROGRESS = 1,
  COMPLETED = 2,
  ERROR = 3
}
export { LoadingState };

@Injectable()
export class LoadingProgressService {
  inProgress = {};
  observable: Observable<LoadingStateChanged>;
  observer: Observer<LoadingStateChanged>;
  LoadingState: typeof LoadingState = LoadingState;

  constructor() {
    this.observable = new Observable<LoadingStateChanged>(observer => this.observer = observer).pipe(share());
  }

  public subscribe(next?: (value: LoadingStateChanged) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.observable.subscribe(next, error, complete);
  }

  start(id: string) {
    this.inProgress[id] = LoadingState.STARTED;
    this.observer.next(new LoadingStateChanged(id, LoadingState.STARTED, 0, Object.keys(this.inProgress).length));
  }

  update(id: string, progress: number) {
    this.inProgress[id] = LoadingState.INPROGRESS;
    this.observer.next(new LoadingStateChanged(id, LoadingState.INPROGRESS, progress, Object.keys(this.inProgress).length));
  }

  complete(id: string, progress?: number, message?: string, callback?: Function) {
    delete this.inProgress[id];
    this.observer.next(new LoadingStateChanged(id, LoadingState.COMPLETED, progress,
      Object.keys(this.inProgress).length, message, callback));
  }

  error(id: string, message?: string, callback?: Function) {
    delete this.inProgress[id];
    this.observer.next(new LoadingStateChanged(id, LoadingState.ERROR, undefined, Object.keys(this.inProgress).length, message, callback));
  }
}
