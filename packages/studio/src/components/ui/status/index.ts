import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Status } from './Status.vue'

export const statusVariants = cva('size-1.5 rounded-full shrink-0', {
  variants: {
    variant: {
      default: 'bg-muted-foreground',
      idle: 'bg-zinc-400 dark:bg-zinc-500',
      info: 'bg-sky-500',
      success: 'bg-emerald-500',
      saved: 'bg-emerald-500',
      warning: 'bg-amber-500',
      pending: 'bg-amber-500',
      error: 'bg-red-500',
      processing: 'bg-blue-500 animate-pulse',
      loading: 'bg-blue-500 animate-pulse',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
})

export type StatusVariants = VariantProps<typeof statusVariants>
