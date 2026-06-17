import { computed, ref } from "vue";

export interface IoSchedulerOptions<T> {
  /** 自动 flush 的防抖延迟，单位毫秒；默认 1500ms。 */
  delay?: number;
  /** 每次 schedule 后压缩 pending 队列，用来合并业务上安全的操作。 */
  compact?: (items: T[]) => T[];
  /** 真正执行 IO 的函数；调度器只负责把需要保存的操作交给它。 */
  save: (items: T[]) => Promise<void>;
}

/**
 * 管理一组需要延迟落盘的 IO 操作。
 *
 * 调度器只负责收集、合并、定时 flush 和失败回滚，不理解具体业务数据；
 * 业务侧通过 compact 定义“哪些操作可以安全合并”。
 */
export class IoScheduler<T> {
  /** 自动保存延迟；调度器内部只在 schedule 时重置这个延迟。 */
  private readonly delay: number;
  /** 业务侧提供的压缩函数；例如合并同一条消息的多次 update。 */
  private readonly compact: (items: T[]) => T[];
  /** 落盘函数；失败时本轮 items 会被放回 pending 队列。 */
  private readonly save: (items: T[]) => Promise<void>;
  /** 待保存操作列表。这里用普通数组，避免 Vue ref 对泛型做深层 unwrap。 */
  private pendingItems: T[] = [];
  /** pending 数量的响应式镜像，提供给 UI 展示“未保存修改”。 */
  private readonly pendingItemsCount = ref(0);
  /** 当前是否正在保存的响应式状态。 */
  private readonly saving = ref(false);
  /** 自动 flush 定时器。 */
  private timer: ReturnType<typeof setTimeout> | undefined;
  /** 当前正在执行的 flush promise，用来复用并发 flush 调用。 */
  private flushing: Promise<void> | undefined;

  constructor(options: IoSchedulerOptions<T>) {
    this.delay = options.delay ?? 1500;
    this.compact = options.compact ?? ((items) => items);
    this.save = options.save;
  }

  /** 当前是否有操作正在保存。 */
  get isSaving() {
    return computed(() => this.saving.value);
  }

  /** 当前等待保存的操作数量。 */
  get pendingCount() {
    return computed(() => this.pendingItemsCount.value);
  }

  /** 添加一个待保存操作，并重置防抖定时器。 */
  schedule(item: T) {
    this.setPendingItems(this.compact([...this.pendingItems, item]));
    this.resetTimer();
  }

  /** 取消自动保存定时器，不清空 pending 操作。 */
  cancel() {
    if (!this.timer) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** 立即保存当前 pending 操作；保存失败时会把操作放回队列。 */
  async flush() {
    if (this.flushing) {
      return this.flushing;
    }

    this.flushing = this.flushNow().finally(() => {
      this.flushing = undefined;
    });

    return this.flushing;
  }

  private resetTimer() {
    this.cancel();
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.delay);
  }

  private setPendingItems(items: T[]) {
    this.pendingItems = items;
    this.pendingItemsCount.value = items.length;
  }

  private async flushNow() {
    this.cancel();

    const items = this.pendingItems;
    if (!items.length) {
      return;
    }

    this.setPendingItems([]);
    this.saving.value = true;

    try {
      await this.save(items);
    } catch (error) {
      // 保存失败不能丢用户输入；把本轮失败操作放回队列头部，等待下次重试。
      this.setPendingItems(this.compact([...items, ...this.pendingItems]));
      this.resetTimer();
      throw error;
    } finally {
      this.saving.value = false;
    }
  }
}

/** 创建一个 IO 调度器实例，用工厂函数隐藏 class 构造细节。 */
export function createIoScheduler<T>(options: IoSchedulerOptions<T>): IoScheduler<T> {
  return new IoScheduler(options);
}
