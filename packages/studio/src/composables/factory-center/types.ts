import type {
  LocaleTreeMeta as CliLocaleTreeMeta,
  LocaleTreeNode as CliLocaleTreeNode,
  TinyI18nGroup as CliTinyI18nGroup,
  TinyI18nItem as CliTinyI18nItem,
  TinyI18nMessage as CliTinyI18nMessage,
  TinyI18nOperation as CliTinyI18nOperation,
} from '../../../../cli/src/core/message.ts'

/**
 * 说明：
 * - CLI 层的 `index` 是可选的（历史兼容）
 * - Studio 的交互语义里我们会「按需补齐」index（例如 create/move 时追加到末尾）
 *
 * 这里不强行把 index 改为必填，
 * 否则会导致从 server 拉回来的原始类型（index?: number）无法直接复用。
 */
export type TinyI18nGroup = CliTinyI18nGroup
export type TinyI18nMessage = CliTinyI18nMessage
export type TinyI18nItem = CliTinyI18nItem

export interface LocaleTreeMeta extends CliLocaleTreeMeta {}

export interface LocaleTreeNode extends Omit<CliLocaleTreeNode, 'original' | 'meta'> {
  original: TinyI18nItem
  meta: LocaleTreeMeta
}

export type TinyI18nOperation = CliTinyI18nOperation

export type MaybeArray<T> = T | Array<T>
