import { DetailedHTMLProps, LabelHTMLAttributes } from "react"

type Props = DetailedHTMLProps<LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement> & {
  required?: boolean
}
export const Label = ({ children, required, ...props }: Props) => {

  return <label {...props} className="mb-1 block text-sm font-medium" >
    {children}
    {required && <span >*</span>}
  </label>
}