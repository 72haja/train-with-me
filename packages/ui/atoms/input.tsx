import * as React from "react"
import styles from './input.module.scss'

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={`${styles.input} ${className || ''}`}
      {...props}
    />
  )
}

export { Input }
