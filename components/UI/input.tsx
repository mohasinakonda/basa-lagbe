import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

type Props = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
export const Input = ({ className = '', ...props }: Props) => {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring ${className}`.trim()}
    />
  )
}
