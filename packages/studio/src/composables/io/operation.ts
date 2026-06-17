import { createIoScheduler } from "./scheduler.ts";

/**
 * 合并 TinyI18n update patch。
 *
 * 普通字段采用“后者覆盖前者”，这样连续编辑 key/title 时只保留最后值；
 * translations 按 locale 深合并，避免编辑 zh-CN 后再编辑 en 时丢掉前一个语言。
 */
export function mergeTinyI18nUpdatePatch(
  previous: Partial<TinyI18nItem> | undefined,
  next: Partial<TinyI18nItem>,
): Partial<TinyI18nItem> {
  const previousTranslations = (previous as Partial<TinyI18nMessage> | undefined)?.translations;
  const nextTranslations = (next as Partial<TinyI18nMessage>).translations;
  const merged = {
    ...previous,
    ...next,
  } as Partial<TinyI18nItem>;

  if (previousTranslations || nextTranslations) {
    (merged as Partial<TinyI18nMessage>).translations = {
      ...previousTranslations,
      ...nextTranslations,
    };
  }

  return merged;
}

function applyUpdateToItem(item: TinyI18nItem, patch: Partial<TinyI18nItem>): TinyI18nItem {
  // message 的 translations 需要按 locale 深合并；group/namespace 没有这个嵌套字段。
  if (item.type === "message") {
    return {
      ...item,
      ...patch,
      translations: {
        ...item.translations,
        ...(patch as Partial<TinyI18nMessage>).translations,
      },
    } as TinyI18nItem;
  }

  return {
    ...item,
    ...patch,
  } as TinyI18nItem;
}

function findCreatedOperation(operations: TinyI18nOperation[], id: string) {
  return operations.find((operation) => operation.type === "create" && operation.data.id === id);
}

/**
 * 删除队列中已经被目标 ids 覆盖的旧操作。
 *
 * 例如 update(A) 后 delete(A)，update 已经没有保存价值；
 * create(A) 后 delete(A)，两者可以抵消。
 */
function removeOperationsByIds(operations: TinyI18nOperation[], ids: Set<string>) {
  return operations.filter((operation) => {
    if (operation.type === "create") {
      return !ids.has(operation.data.id);
    }

    if (operation.type === "update") {
      return !ids.has(operation.data.id);
    }

    if (operation.type === "delete" || operation.type === "move") {
      // 批量操作只有在整批 ids 都被覆盖时才移除，避免误删部分仍有效的操作。
      return !operation.data.ids.every((id) => ids.has(id));
    }

    return true;
  });
}

/**
 * 压缩 TinyI18n 操作队列。
 *
 * 只合并安全规则：update 深合并、create+update 合并、create+delete 抵消、
 * update+delete 变 delete；move 保持顺序，不做冒险合并。
 */
export function compactTinyI18nOperations(operations: TinyI18nOperation[]) {
  return operations.reduce<TinyI18nOperation[]>((nextOperations, operation) => {
    if (operation.type === "create") {
      return [...nextOperations, operation];
    }

    if (operation.type === "update") {
      const createdOperation = findCreatedOperation(nextOperations, operation.data.id);

      if (createdOperation?.type === "create") {
        // 新建项还没落盘时，后续 update 直接合并进 create payload，少一次 IO。
        createdOperation.data = applyUpdateToItem(createdOperation.data, operation.data.patch);
        return nextOperations;
      }

      const lastOperation = nextOperations.at(-1);
      if (lastOperation?.type === "update" && lastOperation.data.id === operation.data.id) {
        // 只合并连续的同 id update，避免跨过 move/delete 这类结构操作改变语义。
        lastOperation.data.patch = mergeTinyI18nUpdatePatch(
          lastOperation.data.patch,
          operation.data.patch,
        );
        return nextOperations;
      }

      return [...nextOperations, operation];
    }

    if (operation.type === "delete") {
      const deletedIds = new Set(operation.data.ids);
      const nextItems = removeOperationsByIds(nextOperations, deletedIds);

      if (nextItems.length !== nextOperations.length) {
        // 如果删除的是本轮刚 create 的项，create/delete 抵消后不需要再发 delete。
        const hasUncreatedDelete = operation.data.ids.some(
          (id) => !findCreatedOperation(nextOperations, id),
        );

        return hasUncreatedDelete ? [...nextItems, operation] : nextItems;
      }

      return [...nextOperations, operation];
    }

    // move 涉及树结构和顺序，第一版保持原始顺序，不做冒险压缩。
    return [...nextOperations, operation];
  }, []);
}

/** 创建 TinyI18n operation 调度器，统一管理自动保存和强制 flush。 */
export function createTinyI18nOperationScheduler(options: {
  delay?: number;
  save: (operations: TinyI18nOperation[]) => Promise<void>;
}) {
  return createIoScheduler<TinyI18nOperation>({
    delay: options.delay,
    compact: compactTinyI18nOperations,
    save: options.save,
  });
}
