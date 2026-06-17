export {};
declare global {
  export interface LocaleTreeMeta {
    path: string;
    chain: LocaleTreeNode[];
    keyChain: string[];
  }

  export interface LocaleTreeNode {
    id: string;
    parent?: string;
    type: TinyI18nItem["type"];
    key: string;
    depth: number;
    hasChildren: boolean;
    original: TinyI18nItem;
    meta: LocaleTreeMeta;
  }

  export interface LocaleTreeGroupNode extends Omit<LocaleTreeNode, "parent"> {
    children: LocaleTreeGroupNode[];
  }

  export interface LocaleTreeModel {
    roots: LocaleTreeGroupNode[];
    flat: LocaleTreeNode[];
    ids: string[];
    expandableIds: string[];
    byId: Map<string, LocaleTreeNode>;
    byPath: Map<string, LocaleTreeNode>;
    childrenById: Map<string, LocaleTreeNode[]>;
    descendantsById: Map<string, LocaleTreeNode[]>;
  }

  export interface GroupTreeModel {
    roots: LocaleTreeGroupNode[];
    flat: LocaleTreeNode[];
    ids: string[];
    expandableIds: string[];
    byId: Map<string, LocaleTreeNode>;
    byPath: Map<string, LocaleTreeNode>;
    childrenById: Map<string, LocaleTreeNode[]>;
    descendantsById: Map<string, LocaleTreeNode[]>;
  }
}
