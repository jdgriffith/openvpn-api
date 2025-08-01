import { describe, beforeEach, it, expect, beforeAll } from 'bun:test';
import '../../../setup-jest';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;

  beforeAll(() => {
    if (!TestBed.platform) {
      TestBed.initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting()
      );
    }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
