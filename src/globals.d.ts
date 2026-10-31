// WHATWG URL is available in every runtime we support (Node, edge, browsers) but
// isn't part of the ES lib. Declared here so the core needs neither DOM nor Node types.
declare class URL {
  constructor(url: string);
  readonly hostname: string;
}
