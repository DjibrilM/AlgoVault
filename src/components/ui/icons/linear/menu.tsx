import type { IconProps } from '../types'

export function Menu1({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 5 18 H 19 M 5 6 H 19 M 5 12 H 19" />
    </svg>
  )
}
export const Menu = Menu1
export const MenuBurger = Menu1

export function Menu2({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 5 18 H 19 M 5 6 H 19 M 5 12 H 11" />
    </svg>
  )
}
export const MoreHorizontal = Menu2

export function Menu3({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 5 18 H 8 M 5 6 H 19 M 5 12 H 11" />
    </svg>
  )
}
export const MoreVertical = Menu3

export function Menu4({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 5 15 H 19 M 5 9 H 19" />
    </svg>
  )
}

export function Menu5({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 9 18 H 15 M 5 12 H 19 M 9 6 H 15" />
    </svg>
  )
}

export function Menu6({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 10 18 H 14 M 5 6 H 19 M 8 12 H 16" />
    </svg>
  )
}

export function Menu7({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 7 18 H 21 M 7 12 H 21 M 7 6 H 21" />
      <path d="M 5 12 C 5 12.552 4.552 13 4 13 C 3.448 13 3 12.552 3 12 C 3 11.448 3.448 11 4 11 C 4.552 11 5 11.448 5 12 Z" />
      <path d="M 5 6 C 5 6.552 4.552 7 4 7 C 3.448 7 3 6.552 3 6 C 3 5.448 3.448 5 4 5 C 4.552 5 5 5.448 5 6 Z" />
      <path d="M 5 18 C 5 18.552 4.552 19 4 19 C 3.448 19 3 18.552 3 18 C 3 17.448 3.448 17 4 17 C 4.552 17 5 17.448 5 18 Z" />
    </svg>
  )
}

export function Menu8({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 9 18 L 19 18 M 13 6 H 19 M 5 12 H 19" />
    </svg>
  )
}

export function Menu9({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 12 10 C 13.105 10 14 10.895 14 12 C 14 13.105 13.105 14 12 14 C 10.895 14 10 13.105 10 12 C 10 10.895 10.895 10 12 10 Z M 4 10 C 5.105 10 6 10.895 6 12 C 6 13.105 5.105 14 4 14 C 2.895 14 2 13.105 2 12 C 2 10.895 2.895 10 4 10 Z M 20 10 C 21.105 10 22 10.895 22 12 C 22 13.105 21.105 14 20 14 C 18.895 14 18 13.105 18 12 C 18 10.895 18.895 10 20 10 Z" />
    </svg>
  )
}

export function Menu10({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 14 12 C 14 13.105 13.105 14 12 14 C 10.895 14 10 13.105 10 12 C 10 10.895 10.895 10 12 10 C 13.105 10 14 10.895 14 12 Z M 14 4 C 14 5.105 13.105 6 12 6 C 10.895 6 10 5.105 10 4 C 10 2.895 10.895 2 12 2 C 13.105 2 14 2.895 14 4 Z M 14 20 C 14 21.105 13.105 22 12 22 C 10.895 22 10 21.105 10 20 C 10 18.895 10.895 18 12 18 C 13.105 18 14 18.895 14 20 Z" />
    </svg>
  )
}

export function Menu11({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 6 12 C 6 13.105 5.105 14 4 14 C 2.895 14 2 13.105 2 12 C 2 10.895 2.895 10 4 10 C 5.105 10 6 10.895 6 12 Z M 14 12 C 14 13.105 13.105 14 12 14 C 10.895 14 10 13.105 10 12 C 10 10.895 10.895 10 12 10 C 13.105 10 14 10.895 14 12 Z M 22 12 C 22 13.105 21.105 14 20 14 C 18.895 14 18 13.105 18 12 C 18 10.895 18.895 10 20 10 C 21.105 10 22 10.895 22 12 Z M 6 4 C 6 5.105 5.105 6 4 6 C 2.895 6 2 5.105 2 4 C 2 2.895 2.895 2 4 2 C 5.105 2 6 2.895 6 4 Z M 14 4 C 14 5.105 13.105 6 12 6 C 10.895 6 10 5.105 10 4 C 10 2.895 10.895 2 12 2 C 13.105 2 14 2.895 14 4 Z M 22 4 C 22 5.105 21.105 6 20 6 C 18.895 6 18 5.105 18 4 C 18 2.895 18.895 2 20 2 C 21.105 2 22 2.895 22 4 Z M 6 20 C 6 21.105 5.105 22 4 22 C 2.895 22 2 21.105 2 20 C 2 18.895 2.895 18 4 18 C 5.105 18 6 18.895 6 20 Z M 14 20 C 14 21.105 13.105 22 12 22 C 10.895 22 10 21.105 10 20 C 10 18.895 10.895 18 12 18 C 13.105 18 14 18.895 14 20 Z M 22 20 C 22 21.105 21.105 22 20 22 C 18.895 22 18 21.105 18 20 C 18 18.895 18.895 18 20 18 C 21.105 18 22 18.895 22 20 Z" />
    </svg>
  )
}
