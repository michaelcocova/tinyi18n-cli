import type { VNode } from 'vue'
import type * as Zod from 'zod'
/**
 * 搜索框类型
 */
export type SearchBoxType
  = | 'input'
    | 'toggle'
    | 'select'
    | 'enum'
    | 'custom'

/**
 * Select 选项
 */
export interface SearchBoxOption {
  label: string
  value?: string | number | boolean
  disabled?: boolean
  description?: string | VNode | (() => VNode)
}

/**
 * 公共配置
 */
export interface SearchBoxBaseSchema {
  /** 固定在最前面 */
  fixed?: boolean

  /**
   * 搜索字段（tag key）
   */
  field: string

  /**
   * tag 左侧显示文案
   */
  label: string

  /**
   * 是否允许重复添加
   *
   * false:
   *   添加后从候选列表移除
   *
   * true:
   *   可以无限次添加
   *
   * 默认 false
   */
  repeatable?: boolean

  /**
   * tag 文案分隔符
   * 默认 ':'
   */
  operator?: string

}

/**
 * Input
 */
export interface InputSearchBoxSchema extends SearchBoxBaseSchema {
  type: 'input'

  placeholder?: string

  validator?: (z: typeof Zod) => Zod.ZodTypeAny
}

/**
 * Toggle
 */
export interface ToggleSearchBoxSchema extends SearchBoxBaseSchema {
  type: 'toggle'
  description?: string | VNode | (() => VNode)
}

/**
 * Select
 */
export interface SelectSearchBoxSchema extends SearchBoxBaseSchema {
  type: 'select'

  placeholder?: string

  /**
   * 可选项
   */
  options: SearchBoxOption[]

  /**
   * 是否多选
   */
  multiple?: boolean

  /**
   * 取值字段
   * 默认 value ?? label
   */
  optionValueKey?: string
}

/**
 * Enum（推荐使用）
 * - mode: single / multi
 * - options 支持 description
 */
export interface EnumSearchBoxSchema extends SearchBoxBaseSchema {
  type: 'enum'

  placeholder?: string

  /**
   * - single：单选（默认）
   * - multi：多选
   */
  mode?: 'single' | 'multi'

  options: SearchBoxOption[]

  optionValueKey?: string
}

/**
 * 自定义渲染
 */
export interface CustomSearchBoxSchema extends SearchBoxBaseSchema {
  type: 'custom'

  /**
   * 具名插槽名称
   * 默认 field
   */
  slotName?: string
}

/**
 * 搜索项配置
 */
export type SearchBoxSchema
  = | InputSearchBoxSchema
    | ToggleSearchBoxSchema
    | SelectSearchBoxSchema
    | EnumSearchBoxSchema
    | CustomSearchBoxSchema

export type SearchBoxSchemas = Array<SearchBoxSchema>

export interface ISearchBoxTag {
  field: string
  label: string
  value: string
  type: SearchBoxType
  operator?: string
  [propName: string]: any
}

/**
 * SearchBox v-model 导出的结果对象（上层直接拿它做搜索/过滤）
 */
export type SearchBoxModelValue = Record<string, any>

export type SearchBoxBeforeUpdate = (
  next: SearchBoxModelValue,
  prev: SearchBoxModelValue,
  context: {
    action:
      | 'add'
      | 'remove'
      | 'clear'
  },
) => SearchBoxModelValue
