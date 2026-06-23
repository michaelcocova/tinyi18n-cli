import type { TinyI18nResolvedConfig } from './config.ts'

export interface TinyI18nGroup {
  id: string
  parent?: string
  type: 'group'
  key: string
  title: string
  index?: number
}

export interface TinyI18nMessage {
  id: string
  parent?: string
  type: 'message'
  key: string
  translations: Record<string, string>
  index?: number
}

export type TinyI18nItem = TinyI18nGroup | TinyI18nMessage

export interface TinyI18nDataFile {
  version?: number
  items: TinyI18nItem[]
  trash?: TinyI18nItem[]
}

export type TinyI18nOperation
  = | {
    type: 'create'
    data: TinyI18nItem
  }
  | {
    type: 'update'
    data: {
      id: string
      patch: Partial<TinyI18nItem>
    }
  }
  | {
    type: 'delete'
    data: {
      ids: string[]
    }
  }
  | {
    type: 'move'
    data: {
      ids: string[]
      parent?: string
    }
  }
  | {
    type: 'restore'
    data: {
      ids: string[]
    }
  }
  | {
    type: 'permanent_delete'
    data: {
      ids: string[]
    }
  }

export interface TinyI18nOperationResult {
  ok: true
  operation: TinyI18nOperation | TinyI18nOperation[]
}

export interface TinyI18nSnapshot {
  root: string
  initialized: boolean
  config: TinyI18nResolvedConfig
  languages: string[]
  items: TinyI18nItem[]
  error?: string
}

export interface LocaleTreeMeta {
  path: string
  chain: LocaleTreeNode[]
  keyChain: string[]
}

export interface LocaleTreeNode {
  id: string
  parent?: string
  type: TinyI18nItem['type']
  key: string
  depth: number
  hasChildren: boolean
  original: TinyI18nItem
  meta: LocaleTreeMeta
}

export interface LocaleTreeGroupNode extends Omit<LocaleTreeNode, 'parent'> {
  children: LocaleTreeGroupNode[]
}

export interface LocaleTreeModel {
  roots: LocaleTreeGroupNode[]
  flat: LocaleTreeNode[]
  ids: string[]
  expandableIds: string[]
  byId: Map<string, LocaleTreeNode>
  byPath: Map<string, LocaleTreeNode>
  childrenById: Map<string, LocaleTreeNode[]>
  descendantsById: Map<string, LocaleTreeNode[]>
}

export interface GroupTreeModel {
  roots: LocaleTreeGroupNode[]
  flat: LocaleTreeNode[]
  ids: string[]
  expandableIds: string[]
  byId: Map<string, LocaleTreeNode>
  byPath: Map<string, LocaleTreeNode>
  childrenById: Map<string, LocaleTreeNode[]>
  descendantsById: Map<string, LocaleTreeNode[]>
}
