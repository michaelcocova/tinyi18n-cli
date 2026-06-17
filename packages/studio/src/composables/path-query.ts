export type TinyI18nPathFilterMode = "include" | "exclude";

export interface TinyI18nPathFilter {
  id: string;
  mode: TinyI18nPathFilterMode;
  query: string;
}

type PathMatchNode =
  | {
      keyChain: string[];
    }
  | {
      meta: {
        keyChain: string[];
      };
    };

type ParsedPathQuery =
  | {
      type: "root";
      segments: string[];
    }
  | {
      type: "descendant";
      key: string;
    };

/**
 * TinyI18n Path Query 只借用 JSONPath 的 `$` 和 `..` 语义。
 * 这里不实现完整 JSONPath，避免把 i18n tree 过滤做成过重的通用查询语言。
 */
export function normalizePathQuery(value: string) {
  const query = value.trim().replace(/\s+/g, "");

  if (!query) {
    return "";
  }

  if (query.startsWith("$")) {
    return query;
  }

  return `$.${query.replace(/^\.+/, "")}`;
}

export function matchPathQuery(node: PathMatchNode, query: string) {
  const parsed = parsePathQuery(query);

  if (!parsed) {
    return false;
  }

  const keyChain = "meta" in node ? node.meta.keyChain : node.keyChain;

  if (parsed.type === "root") {
    return parsed.segments.every((segment, index) => keyChain[index] === segment);
  }

  return keyChain.includes(parsed.key);
}

export function matchPathFilters(node: PathMatchNode, filters: TinyI18nPathFilter[]) {
  const includeQueries = filters
    .filter((filter) => filter.mode === "include")
    .map((filter) => filter.query);
  const excludeQueries = filters
    .filter((filter) => filter.mode === "exclude")
    .map((filter) => filter.query);
  const matchesInclude =
    includeQueries.length === 0 || includeQueries.some((query) => matchPathQuery(node, query));
  const matchesExclude = excludeQueries.some((query) => matchPathQuery(node, query));

  return matchesInclude && !matchesExclude;
}

function parsePathQuery(query: string): ParsedPathQuery | undefined {
  const normalized = normalizePathQuery(query);

  if (normalized.startsWith("$..")) {
    const key = normalized.slice(3);

    if (!isValidPathSegment(key)) {
      return undefined;
    }

    return {
      type: "descendant",
      key,
    };
  }

  if (normalized.startsWith("$.")) {
    const segments = normalized.slice(2).split(".").filter(Boolean);

    if (!segments.length || !segments.every(isValidPathSegment)) {
      return undefined;
    }

    return {
      type: "root",
      segments,
    };
  }

  return undefined;
}

function isValidPathSegment(segment: string) {
  return /^[\w-]+$/.test(segment);
}
