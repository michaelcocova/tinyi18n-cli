interface QualityWorkerPayload {
  items: TinyI18nItem[];
  languages: string[];
}

function createCounts(): TinyI18nQualityReport["counts"] {
  return {
    missing_key: 0,
    missing_translation: 0,
    empty_translation: 0,
    duplicate_path_global: 0,
    duplicate_path_group: 0,
  };
}

function pushIssue(report: TinyI18nQualityReport, issue: TinyI18nQualityIssue) {
  report.issues.push(issue);
  report.counts[issue.kind] += 1;
}

function buildNodeMaps(items: TinyI18nItem[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const pathCache = new Map<string, string>();
  const groupCache = new Map<string, string>();

  function resolvePath(id: string): string {
    const cached = pathCache.get(id);
    if (cached) {
      return cached;
    }

    const item = byId.get(id);
    if (!item) {
      return "";
    }

    const path = item.parent ? `${resolvePath(item.parent)}.${item.key}` : item.key;
    pathCache.set(id, path);
    return path;
  }

  function resolveGroup(id: string): string {
    const cached = groupCache.get(id);
    if (cached) {
      return cached;
    }

    const item = byId.get(id);
    if (!item) {
      return "";
    }

    const group = item.parent ? resolveGroup(item.parent) : item.key;
    groupCache.set(id, group);
    return group;
  }

  return { byId, resolvePath, resolveGroup };
}

function scanQuality(payload: QualityWorkerPayload): TinyI18nQualityReport {
  const report: TinyI18nQualityReport = {
    scannedMessages: 0,
    issues: [],
    counts: createCounts(),
    groupConflicts: [],
  };

  const { items, languages } = payload;
  const { resolveGroup, resolvePath } = buildNodeMaps(items);
  const messages = items.filter((item): item is TinyI18nMessage => item.type === "message");
  const globalPathMap = new Map<string, TinyI18nMessage[]>();
  const groupPathMap = new Map<string, TinyI18nMessage[]>();

  for (const message of messages) {
    report.scannedMessages += 1;

    const path = resolvePath(message.id);
    const group = resolveGroup(message.id);
    const normalizedPath = path.trim();

    if (!message.key.trim()) {
      pushIssue(report, {
        id: `missing_key:${message.id}`,
        kind: "missing_key",
        messageId: message.id,
        group,
        path,
        title: "缺失 key",
        detail: "当前消息节点没有可用的 key。",
      });
    }

    if (!normalizedPath) {
      continue;
    }

    const globalBucket = globalPathMap.get(normalizedPath) ?? [];
    globalBucket.push(message);
    globalPathMap.set(normalizedPath, globalBucket);

    const groupScopedPath = `${group}::${normalizedPath}`;
    const groupBucket = groupPathMap.get(groupScopedPath) ?? [];
    groupBucket.push(message);
    groupPathMap.set(groupScopedPath, groupBucket);

    for (const locale of languages) {
      if (!(locale in message.translations)) {
        pushIssue(report, {
          id: `missing_translation:${message.id}:${locale}`,
          kind: "missing_translation",
          messageId: message.id,
          group,
          path,
          locale,
          title: "缺失翻译",
          detail: `${locale} 没有对应翻译字段。`,
        });
        continue;
      }

      if (!String(message.translations[locale] ?? "").trim()) {
        pushIssue(report, {
          id: `empty_translation:${message.id}:${locale}`,
          kind: "empty_translation",
          messageId: message.id,
          group,
          path,
          locale,
          title: "空翻译",
          detail: `${locale} 的翻译内容为空。`,
        });
      }
    }
  }

  for (const [path, bucket] of globalPathMap) {
    if (bucket.length < 2) {
      continue;
    }

    const relatedIds = bucket.map((item) => item.id);
    for (const message of bucket) {
      pushIssue(report, {
        id: `duplicate_path_global:${message.id}:${path}`,
        kind: "duplicate_path_global",
        messageId: message.id,
        group: resolveGroup(message.id),
        path,
        title: "全局重复 path",
        detail: "同一个 path 在整个工作区中出现了重复消息。",
        relatedIds,
      });
    }
  }

  for (const [scopedPath, bucket] of groupPathMap) {
    if (bucket.length < 2) {
      continue;
    }

    const [group, path] = scopedPath.split("::");
    const relatedIds = bucket.map((item) => item.id);
    const items: TinyI18nQualityIssue[] = [];
    for (const message of bucket) {
      const issue: TinyI18nQualityIssue = {
        id: `duplicate_path_group:${message.id}:${scopedPath}`,
        kind: "duplicate_path_group",
        messageId: message.id,
        group,
        path,
        title: "分组内重复 path",
        detail: "同一个根分组下存在重复 path。",
        relatedIds,
      };

      items.push(issue);
      pushIssue(report, issue);
    }

    report.groupConflicts.push({
      id: `group_conflict:${scopedPath}`,
      group: {
        key: group,
        title: group,
      },
      items,
    });
  }

  return report;
}

self.onmessage = (event: MessageEvent<QualityWorkerPayload>) => {
  self.postMessage(scanQuality(event.data));
};
