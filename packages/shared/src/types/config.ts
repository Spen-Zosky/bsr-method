export type LLMTarget = 'claude' | 'cursor' | 'copilot' | 'vscode' | 'generic';
export type ProjectType = 'greenfield' | 'brownfield';

export interface BSRConfig {
  version: string;
  project: {
    name: string;
    type: ProjectType;
    created: string;
  };
  llm: {
    target: LLMTarget;
  };
  workflow: {
    auto_commit: boolean;
    commit_prefix?: string;
    progress_file: string;
  };
  discovery?: {
    enabled: boolean;
    scanners: Record<string, boolean>;
    exclude: string[];
  };
  dashboard?: {
    port: number;
    auto_open: boolean;
  };
  export?: {
    formats: string[];
    output_dir: string;
  };
  memory?: {
    enabled: boolean;
    database: string;
  };
}
