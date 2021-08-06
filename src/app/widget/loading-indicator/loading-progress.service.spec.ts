import { TestBed, inject } from '@angular/core/testing';

import { LoadingProgressService } from './loading-progress.service';

describe('LoadingProgressService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingProgressService]
    });
  });

  it('should be created', inject([LoadingProgressService], (service: LoadingProgressService) => {
    expect(service).toBeTruthy();
  }));
});
