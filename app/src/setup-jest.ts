// Mock Jest functions that Zone.js expects BEFORE loading Zone.js
import { describe as bunDescribe, beforeEach as bunBeforeEach, it as bunIt, expect as bunExpect, mock, beforeAll as bunBeforeAll, afterAll as bunAfterAll, afterEach as bunAfterEach } from 'bun:test';

// Set up DOM globals before loading Zone.js
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Set up Jest-compatible functions BEFORE loading Zone.js
global.describe = bunDescribe;
global.it = bunIt;  
global.test = bunIt;
global.beforeEach = bunBeforeEach;
global.beforeAll = bunBeforeAll;
global.afterEach = bunAfterEach;
global.afterAll = bunAfterAll;
global.expect = bunExpect;

// Add the 'each' property that Zone.js expects
(global.describe as any).each = () => global.describe;
(global.it as any).each = () => global.it;
(global.test as any).each = () => global.test;

// Simple setup for Angular testing with Bun - avoid zone.js/testing
import 'zone.js';

// Initialize Angular testing environment globally
import { TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Mock jasmine functions that Angular tests might use
global.jasmine = {
  createSpyObj: (name: string, methods: string[]) => {
    const spyObj: any = {};
    methods.forEach((method) => {
      const spy = mock();
      spy.and = {
        returnValue: (value: any) => {
          spy.mockReturnValue(value);
          return spy;
        },
        callThrough: () => spy
      };
      spyObj[method] = spy;
    });
    return spyObj;
  },
} as any;

// Global mocks for browser APIs
Object.defineProperty(window, 'CSS', {value: null});
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance']
    };
  }
});

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});
Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});