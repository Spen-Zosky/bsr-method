export interface DiscoveredProjectState {
  metadata: {
    discoveryDate: string;
    repository: string;
    confidenceScore: number;
  };
  derivedIdea: {
    domain: string;
    summary: string;
    coreCapabilities: string[];
  };
  technologyStack: {
    runtime: { name: string; version: string };
    framework?: { name: string; version: string };
    database?: { type: string };
  };
  architecture: {
    style: string;
    layers: Array<{ name: string; path: string }>;
  };
  gapsAndDebt: {
    critical: Array<{ type: string; description: string }>;
    high: Array<{ type: string; description: string }>;
  };
}
