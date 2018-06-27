import { TestBed, inject } from '@angular/core/testing';

import { PreLoaderService } from './pre-loader.service';

describe('PreLoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreLoaderService]
    });
  });

  it('should be created', inject([PreLoaderService], (service: PreLoaderService) => {
    expect(service).toBeTruthy();
  }));
});
