import type { TinyI18nResolvedConfig } from "./config.ts";

export interface TinyI18nGroup {
  id: string;
  type: "group";
  parent?: string;
  key: string;
  title: string;
}

export interface TinyI18nMessage {
  id: string;
  type: "message";
  parent?: string;
  key: string;
  translations: Record<string, string>;
}

export type TinyI18nItem = TinyI18nGroup | TinyI18nMessage;

export interface TinyI18nDataFile {
  version?: number;
  items: TinyI18nItem[];
}

export type TinyI18nOperation =
  | {
      type: "create";
      data: TinyI18nItem;
    }
  | {
      type: "update";
      data: {
        id: string;
        patch: Partial<TinyI18nItem>;
      };
    }
  | {
      type: "delete";
      data: {
        ids: string[];
      };
    }
  | {
      type: "move";
      data: {
        ids: string[];
        parent?: string;
      };
    };

export interface TinyI18nOperationResult {
  ok: true;
  operation: TinyI18nOperation | TinyI18nOperation[];
}

export interface TinyI18nSnapshot {
  root: string;
  initialized: boolean;
  config: TinyI18nResolvedConfig;
  languages: string[];
  items: TinyI18nItem[];
  error?: string;
}
