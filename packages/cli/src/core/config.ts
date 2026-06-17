export interface TinyI18nLocaleConfig {
  code: string;
  filename?: string;
}

export interface TinyI18nEntryConfig {
  dir: string;
  paths: string[];
  include?: string[];
  exclude?: string[];
}

/**
 * 用户配置
 */
export interface TinyI18nUserConfig {
  /**
   * 本地化文件名
   * @default ".data.json"
   */
  filename?: string;
  /**
   * 本地化文件配置
   * @default []
   */
  locales?: TinyI18nLocaleConfig[] | string[];
  /** 默认本地化文件 */
  defaultLocale?: string;
  /** 本地化文件入口配置 */
  entries?: TinyI18nEntryConfig[];
}

export interface TinyI18nResolvedLocaleConfig {
  code: string;
  filename: string;
}

export interface TinyI18nResolvedConfig extends Omit<TinyI18nUserConfig, "locales"> {
  locales: TinyI18nResolvedLocaleConfig[];
  filename: string;
}

function resolveLocale(locale: TinyI18nLocaleConfig | string): TinyI18nResolvedLocaleConfig {
  if (typeof locale === "string") {
    return {
      code: locale,
      filename: `${locale}.json`,
    };
  }

  return {
    code: locale.code,
    filename: locale.filename ?? `${locale.code}.json`,
  };
}

export function resolveConfig(config: TinyI18nUserConfig): TinyI18nResolvedConfig {
  return {
    ...config,
    filename: config.filename ?? ".data.json",
    locales: (config.locales ?? []).map(resolveLocale),
  };
}

export function defineConfig(config: TinyI18nUserConfig) {
  return resolveConfig(config);
}
