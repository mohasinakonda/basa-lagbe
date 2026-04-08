import { DetailedHTMLProps, LabelHTMLAttributes } from 'react'

type Props = DetailedHTMLProps<LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement> & {
  required?: boolean
}
export const Label = ({ children, required, className = '', ...props }: Props) => {
  return (
    <label {...props} className={`mb-1 block text-sm font-medium text-foreground ${className}`.trim()}>
      {children}
      {required && (
        <>
          {' '}
          <span className="text-primary" aria-hidden>
            *
          </span>
        </>
      )}
    </label>
  )
}
