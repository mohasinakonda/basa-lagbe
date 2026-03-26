import { DetailedHTMLProps, InputHTMLAttributes } from "react"

type Props = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
export const Input = ({ ...props }: Props) => {

  return <input
    {...props}
    className="w-full rounded border border-(--foreground)/20 bg-background px-3 py-2"
  />
}

