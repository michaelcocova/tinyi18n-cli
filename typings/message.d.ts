export {};
declare global {
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

  export interface TinyI18nLocaleConfig {
    code: string;
    filename: string;
    label: string;
  }

  export interface TinyI18nEntryConfig {
    dir: string;
    namespaces?: string[];
  }

  export interface TinyI18nConfig {
    dir?: string;
    filename?: string;
    locales: TinyI18nLocaleConfig[];
    defaultLocale?: string;
    entries?: TinyI18nEntryConfig[];
  }

  export interface TinyI18nSnapshot {
    root: string;
    initialized: boolean;
    config: TinyI18nConfig;
    languages: string[];
    items: TinyI18nItem[];
    error?: string;
  }

  export interface TinyI18nWebConfig {
    apiBase: string;
    routeBase: string;
  }

  export type TinyI18nQualityIssueKind =
    | "missing_key"
    | "missing_translation"
    | "empty_translation"
    | "duplicate_path_global"
    | "duplicate_path_group";

  export interface TinyI18nQualityIssue {
    id: string;
    kind: TinyI18nQualityIssueKind;
    messageId?: string;
    group: string;
    path: string;
    locale?: string;
    title: string;
    detail: string;
    relatedIds?: string[];
  }

  export interface TinyI18nGroupConflict {
    id: string;
    group: {
      key: string;
      title?: string;
    };
    items: TinyI18nQualityIssue[];
  }

  export interface TinyI18nQualityReport {
    scannedMessages: number;
    issues: TinyI18nQualityIssue[];
    counts: Record<TinyI18nQualityIssueKind, number>;
    groupConflicts: TinyI18nGroupConflict[];
  }

  type LocaleMessages = Record<string, unknown>;
}
