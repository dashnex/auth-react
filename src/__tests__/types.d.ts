/// <reference types="jest" />

declare global {
  var fetch: jest.Mock<Promise<Response>, [string, RequestInit?]>;
} 