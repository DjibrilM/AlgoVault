import type { IconProps } from '../types'

export function Arrows1({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 7 6 L 7 19 V 20 M 3 16 L 4.398 17.763 C 5.513 19.169 6.07 19.872 6.749 19.98 C 6.833 19.993 6.916 20 7 20 M 11 16 L 9.602 17.763 C 8.487 19.169 7.93 19.872 7.251 19.98 C 7.167 19.993 7.084 20 7 20 M 17 19 L 17 6 V 5 M 13 9 L 14.398 7.237 C 15.513 5.831 16.07 5.128 16.749 5.02 C 16.833 5.007 16.916 5 17 5 M 21 9 L 19.602 7.237 C 18.487 5.831 17.93 5.128 17.251 5.02 C 17.167 5.007 17.084 5 17 5" />
    </svg>
  )
}
export const ArrowUp = Arrows1

export function Arrows2({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 8.667 7.667 L 8.667 16.333 V 17 M 11.333 14.333 L 10.401 15.508 C 9.658 16.446 9.287 16.914 8.834 16.987 C 8.778 16.995 8.722 17 8.667 17 C 8.611 17 8.555 16.995 8.5 16.987 C 8.047 16.914 7.675 16.446 6.932 15.508 L 6 14.333 M 15.333 16.333 V 7.667 V 7 M 12.667 9.667 L 13.599 8.491 C 14.342 7.554 14.713 7.085 15.166 7.013 C 15.222 7.004 15.278 7 15.333 7 M 18 9.667 L 17.068 8.491 C 16.325 7.554 15.953 7.085 15.501 7.013 C 15.445 7.004 15.389 7 15.333 7 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}
export const ArrowDown = Arrows2

export function Arrows3({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 20 11 C 20.628 11.836 21 12.874 21 14 V 15 C 21 15.929 21 16.394 20.938 16.782 C 20.6 18.922 18.922 20.6 16.782 20.938 C 16.394 21 15.929 21 15 21 H 9 C 8.071 21 7.606 21 7.218 20.938 C 5.078 20.6 3.4 18.922 3.062 16.782 C 3 16.394 3 15.929 3 15 V 14 C 3 12.874 3.372 11.836 4 11 M 12 3 V 16 V 17 M 8 13 L 9.398 14.763 C 10.513 16.169 11.07 16.872 11.749 16.98 C 11.833 16.993 11.916 17 12 17 M 16 13 L 14.602 14.763 C 13.487 16.169 12.93 16.872 12.251 16.98 C 12.167 16.993 12.084 17 12 17" />
    </svg>
  )
}
export const ArrowLeft = Arrows3

export function Arrows4({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 20 11 C 20.628 11.836 21 12.874 21 14 V 15 C 21 15.929 21 16.394 20.938 16.782 C 20.6 18.922 18.922 20.6 16.782 20.938 C 16.394 21 15.929 21 15 21 H 9 C 8.071 21 7.606 21 7.218 20.938 C 5.078 20.6 3.4 18.922 3.062 16.782 C 3 16.394 3 15.929 3 15 V 14 C 3 12.874 3.372 11.836 4 11 M 12 17 V 4 V 3 M 8 7 L 9.398 5.237 C 10.513 3.831 11.07 3.128 11.749 3.02 C 11.833 3.007 11.916 3 12 3 M 16 7 L 14.602 5.237 C 13.487 3.831 12.93 3.128 12.251 3.02 C 12.167 3.007 12.084 3 12 3" />
    </svg>
  )
}
export const ArrowRight = Arrows4

export function Arrows5({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 8 V 16 M 16 12.8 L 14.602 14.21 C 13.487 15.335 12.93 15.897 12.251 15.984 C 12.167 15.995 12.084 16 12 16 M 8 12.8 L 9.398 14.21 C 10.513 15.335 11.07 15.897 11.749 15.984 C 11.833 15.995 11.916 16 12 16 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}
export const ChevronUp = Arrows5

export function Arrows6({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 16 V 8.8 V 8 M 16 11.2 L 14.602 9.79 C 13.487 8.665 12.93 8.103 12.251 8.016 C 12.167 8.005 12.084 8 12 8 C 11.916 8 11.833 8.005 11.749 8.016 C 11.07 8.103 10.513 8.665 9.398 9.79 L 8 11.2 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}
export const ChevronDown = Arrows6

export function Arrows7({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 16 12 H 8.8 H 8 M 11.2 16 L 9.79 14.602 C 8.665 13.487 8.103 12.93 8.016 12.251 C 8.005 12.167 8 12.084 8 12 M 11.2 8 L 9.79 9.398 C 8.665 10.513 8.103 11.07 8.016 11.749 C 8.005 11.833 8 11.916 8 12 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}
export const ChevronLeft = Arrows7

export function Arrows8({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 8 12 L 15.2 12 H 16 M 12.8 16 L 14.21 14.602 C 15.335 13.487 15.897 12.93 15.984 12.251 C 15.995 12.167 16 12.084 16 12 C 16 11.916 15.995 11.833 15.984 11.749 C 15.897 11.07 15.335 10.513 14.21 9.398 L 12.8 8 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}
export const ChevronRight = Arrows8

export function Arrows9({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 17 10 L 15.253 11.763 C 13.859 13.169 13.163 13.872 12.313 13.98 C 12.105 14.007 11.895 14.007 11.687 13.98 C 10.837 13.872 10.141 13.169 8.747 11.763 L 7 10 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}

export function Arrows10({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 7 14 L 8.747 12.237 C 10.141 10.831 10.837 10.128 11.687 10.02 C 11.895 9.993 12.105 9.993 12.313 10.02 C 13.163 10.128 13.859 10.831 15.253 12.237 L 17 14 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}

export function Arrows11({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 14 17 L 12.237 15.253 C 10.831 13.859 10.128 13.163 10.02 12.313 C 9.993 12.105 9.993 11.895 10.02 11.687 C 10.128 10.837 10.831 10.141 12.237 8.747 L 14 7 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}

export function Arrows12({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 10 7 L 11.763 8.747 C 13.169 10.141 13.872 10.837 13.98 11.687 C 14.007 11.895 14.007 12.105 13.98 12.313 C 13.872 13.163 13.169 13.859 11.763 15.253 L 10 17 M 12 21 C 8.25 21 6.375 21 5.061 20.045 C 4.637 19.737 4.263 19.363 3.955 18.939 C 3 17.625 3 15.75 3 12 C 3 8.25 3 6.375 3.955 5.061 C 4.263 4.637 4.637 4.263 5.061 3.955 C 6.375 3 8.25 3 12 3 C 15.75 3 17.625 3 18.939 3.955 C 19.363 4.263 19.737 4.637 20.045 5.061 C 21 6.375 21 8.25 21 12 C 21 15.75 21 17.625 20.045 18.939 C 19.737 19.363 19.363 19.737 18.939 20.045 C 17.625 21 15.75 21 12 21 Z" />
    </svg>
  )
}

export function Arrows13({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 8 V 15.2 V 16 M 8 12.8 L 9.398 14.21 C 10.513 15.335 11.07 15.897 11.749 15.984 C 11.833 15.995 11.916 16 12 16 C 12.084 16 12.167 15.995 12.251 15.984 C 12.93 15.897 13.487 15.335 14.602 14.21 L 16 12.8 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows14({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 16 V 8.8 V 8.016 M 8 11.2 L 9.398 9.79 C 10.513 8.665 11.07 8.103 11.749 8.016 C 11.916 7.995 12.084 7.995 12.251 8.016 C 12.93 8.103 13.487 8.665 14.602 9.79 L 16 11.2 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows15({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 16 12 H 8.8 H 8 M 11.2 16 L 9.79 14.602 C 8.665 13.487 8.103 12.93 8.016 12.251 C 8.005 12.167 8 12.084 8 12 M 11.2 8 L 9.79 9.398 C 8.665 10.513 8.103 11.07 8.016 11.749 C 8.005 11.833 8 11.916 8 12 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows16({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 8 12 L 15.2 12 H 16 M 12.8 16 L 14.21 14.602 C 15.335 13.487 15.897 12.93 15.984 12.251 C 15.995 12.167 16 12.084 16 12 C 16 11.916 15.995 11.833 15.984 11.749 C 15.897 11.07 15.335 10.513 14.21 9.398 L 12.8 8 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows17({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 17 10 L 15.253 11.763 C 13.859 13.169 13.163 13.872 12.313 13.98 C 12.105 14.007 11.895 14.007 11.687 13.98 C 10.837 13.872 10.141 13.169 8.747 11.763 L 7 10 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows18({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 7 14 L 8.747 12.237 C 10.141 10.831 10.837 10.128 11.687 10.02 C 11.895 9.993 12.105 9.993 12.313 10.02 C 13.163 10.128 13.859 10.831 15.253 12.237 L 17 14 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows19({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 14 17 L 12.237 15.253 C 10.831 13.859 10.128 13.163 10.02 12.313 C 9.993 12.105 9.993 11.895 10.02 11.687 C 10.128 10.837 10.831 10.141 12.237 8.747 L 14 7 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows20({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 10 7 L 11.763 8.747 C 13.169 10.141 13.872 10.837 13.98 11.687 C 14.007 11.895 14.007 12.105 13.98 12.313 C 13.872 13.163 13.169 13.859 11.763 15.253 L 10 17 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Arrows21({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 4 L 12 20 M 12 20 C 12.105 20 12.209 19.993 12.313 19.98 C 13.163 19.872 13.859 19.169 15.253 17.763 L 15.253 17.763 L 17 16 M 12 20 C 11.895 20 11.791 19.993 11.687 19.98 C 10.837 19.872 10.141 19.169 8.747 17.763 L 7 16" />
    </svg>
  )
}

export function Arrows22({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 20 L 12 4 M 12 4 C 11.895 4 11.791 4.007 11.687 4.02 C 10.837 4.128 10.141 4.831 8.747 6.237 L 7 8 M 12 4 C 12.105 4 12.209 4.007 12.313 4.02 C 13.163 4.128 13.859 4.831 15.253 6.237 L 17 8" />
    </svg>
  )
}

export function Arrows23({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 20 12 H 4 M 4 12 C 4 12.105 4.007 12.209 4.02 12.313 C 4.128 13.163 4.831 13.859 6.237 15.253 L 8 17 M 4 12 C 4 11.895 4.007 11.791 4.02 11.687 C 4.128 10.837 4.831 10.141 6.237 8.747 L 6.237 8.747 L 8 7" />
    </svg>
  )
}

export function Arrows24({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 4 12 L 20 12 M 20 12 C 20 11.895 19.993 11.791 19.98 11.687 C 19.872 10.837 19.169 10.141 17.763 8.747 L 16 7 M 20 12 C 20 12.105 19.993 12.209 19.98 12.313 C 19.872 13.163 19.169 13.859 17.763 15.253 L 16 17" />
    </svg>
  )
}

export function Arrows25({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 17 10 L 15.253 11.763 C 13.859 13.169 13.163 13.872 12.313 13.98 C 12.105 14.007 11.895 14.007 11.687 13.98 C 10.837 13.872 10.141 13.169 8.747 11.763 L 8.747 11.763 L 7 10" />
    </svg>
  )
}

export function Arrows26({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 7 14 L 8.747 12.237 C 10.141 10.831 10.837 10.128 11.687 10.02 C 11.895 9.993 12.105 9.993 12.313 10.02 C 13.163 10.128 13.859 10.831 15.253 12.237 L 17 14" />
    </svg>
  )
}

export function Arrows27({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 14 17 L 12.237 15.253 C 10.831 13.859 10.128 13.163 10.02 12.313 C 9.993 12.105 9.993 11.895 10.02 11.687 C 10.128 10.837 10.831 10.141 12.237 8.747 L 12.237 8.747 L 14 7" />
    </svg>
  )
}

export function Arrows28({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 10 7 L 11.763 8.747 L 11.763 8.747 C 13.169 10.141 13.872 10.837 13.98 11.687 C 14.007 11.895 14.007 12.105 13.98 12.313 C 13.872 13.163 13.169 13.859 11.763 15.253 L 10 17" />
    </svg>
  )
}

export function Arrows29({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 3 L 12 14 M 14.865 14 H 9.135 C 7.476 14 6.538 15.905 7.551 17.22 L 10.415 20.941 C 11.216 21.981 12.784 21.981 13.585 20.941 L 16.449 17.22 C 17.462 15.905 16.524 14 14.865 14 Z" />
    </svg>
  )
}

export function Arrows30({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 21 L 12 10 M 9.135 10 L 14.865 10 C 16.524 10 17.462 8.095 16.449 6.78 L 13.585 3.059 C 12.784 2.019 11.216 2.019 10.415 3.059 L 7.551 6.78 C 6.538 8.095 7.476 10 9.135 10 Z" />
    </svg>
  )
}

export function Arrows31({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 21 12 L 10 12 M 10 14.865 L 10 9.135 C 10 7.476 8.095 6.538 6.78 7.55 L 3.059 10.415 C 2.019 11.216 2.019 12.784 3.059 13.585 L 6.78 16.449 C 8.095 17.462 10 16.524 10 14.865 Z" />
    </svg>
  )
}

export function Arrows32({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 3 12 L 14 12 M 14 9.136 V 14.865 C 14 16.524 15.905 17.462 17.22 16.45 L 20.941 13.585 C 21.981 12.784 21.981 11.216 20.941 10.415 L 17.22 7.551 C 15.905 6.538 14 7.476 14 9.136 Z" />
    </svg>
  )
}

export function Arrows33({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 11 4 C 11.836 3.372 12.874 3 14 3 H 15 C 15.929 3 16.394 3 16.782 3.062 C 18.922 3.4 20.6 5.078 20.938 7.218 C 21 7.606 21 8.071 21 9 V 15 C 21 15.929 21 16.394 20.938 16.782 C 20.6 18.922 18.922 20.6 16.782 20.938 C 16.394 21 15.929 21 15 21 H 14 C 12.874 21 11.836 20.628 11 20 M 3 12 L 16 12 H 17 M 13 16 L 14.763 14.602 C 16.169 13.487 16.872 12.93 16.98 12.251 C 16.993 12.167 17 12.084 17 12 M 13 8 L 14.763 9.398 C 16.169 10.513 16.872 11.07 16.98 11.749 C 16.993 11.833 17 11.916 17 12" />
    </svg>
  )
}

export function Arrows34({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 13 20 C 12.164 20.628 11.126 21 10 21 H 9 C 8.071 21 7.606 21 7.218 20.938 C 5.078 20.6 3.4 18.922 3.062 16.782 C 3 16.394 3 15.929 3 15 V 9 C 3 8.071 3 7.606 3.062 7.218 C 3.4 5.078 5.078 3.4 7.218 3.062 C 7.606 3 8.071 3 9 3 H 10 C 11.126 3 12.164 3.372 13 4 M 7 12 L 20 12 H 21 M 17 8 L 18.763 9.398 C 20.169 10.513 20.872 11.07 20.98 11.749 C 20.993 11.833 21 11.916 21 12 M 17 16 L 18.763 14.602 C 20.169 13.487 20.872 12.93 20.98 12.251 C 20.993 12.167 21 12.084 21 12" />
    </svg>
  )
}

export function Arrows35({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 22 13 C 22 18.523 17.523 23 12 23 C 6.477 23 2 18.523 2 13 C 2 7.477 6.477 3 12 3 C 14.252 3 16.329 3.744 18.001 5 C 18.758 5.569 19.431 6.242 20 6.999 L 20.091 7.091 M 20.657 2 L 20.666 3.986 C 20.673 5.569 20.676 6.361 20.257 6.903 C 20.206 6.969 20.15 7.032 20.091 7.091 M 15 7.657 L 16.986 7.666 C 18.569 7.673 19.361 7.676 19.903 7.257 C 19.969 7.206 20.032 7.15 20.091 7.091" />
    </svg>
  )
}

export function Arrows36({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 2 13 C 2 18.523 6.477 23 12 23 C 17.523 23 22 18.523 22 13 C 22 7.477 17.523 3 12 3 C 9.748 3 7.671 3.744 5.999 5 C 5.242 5.569 4.569 6.242 4 6.999 L 3.875 7.136 M 3.263 2 L 3.254 3.986 C 3.247 5.569 3.243 6.361 3.662 6.903 C 3.727 6.986 3.798 7.064 3.875 7.136 M 8.92 7.657 L 6.934 7.666 H 6.934 C 5.35 7.673 4.558 7.676 4.017 7.257 C 3.968 7.219 3.92 7.179 3.875 7.136" />
    </svg>
  )
}

export function Arrows37({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 2 12 C 2 17.523 6.477 22 12 22 C 15.041 22 17.766 20.642 19.6 18.5 L 20.114 17.851 M 22 12 C 22 6.477 17.523 2 12 2 C 8.959 2 6.234 3.358 4.4 5.5 L 3.83 6.092 M 8.92 6.657 L 6.934 6.666 H 6.934 C 5.35 6.673 4.558 6.676 4.017 6.257 C 3.951 6.206 3.888 6.151 3.83 6.092 C 3.77 6.033 3.714 5.969 3.662 5.903 C 3.243 5.361 3.247 4.569 3.254 2.986 L 3.263 1 M 20.657 22.92 L 20.666 20.934 C 20.673 19.35 20.676 18.559 20.257 18.017 C 20.212 17.959 20.164 17.904 20.114 17.851 M 15 17.263 L 16.986 17.254 H 16.986 C 18.569 17.247 19.361 17.243 19.903 17.662 C 19.977 17.72 20.048 17.783 20.114 17.851" />
    </svg>
  )
}

export function Arrows38({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 2 12 C 2 6.477 6.477 2 12 2 C 15.041 2 17.766 3.358 19.6 5.5 M 22 12 C 22 17.523 17.523 22 12 22 C 8.959 22 6.234 20.642 4.4 18.5 M 20.656 1 L 20.665 2.986 C 20.672 4.569 20.675 5.361 20.256 5.903 C 20.154 6.035 20.035 6.154 19.902 6.257 C 19.36 6.676 18.568 6.673 16.985 6.666 L 14.999 6.657 M 3.262 22.92 L 3.253 20.934 C 3.246 19.35 3.242 18.559 3.662 18.017 C 3.764 17.884 3.883 17.765 4.016 17.662 C 4.558 17.243 5.349 17.247 6.933 17.254 H 6.933 L 8.919 17.263" />
    </svg>
  )
}

export function Arrows39({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 6 19 H 14 C 16.761 19 19 16.761 19 14 C 19 11.239 16.761 9 14 9 H 5 L 4 9 M 7.2 13 L 5.79 11.602 C 4.665 10.487 4.103 9.93 4.016 9.251 C 4.005 9.167 4 9.084 4 9 M 7.2 5 L 5.79 6.398 L 5.79 6.398 C 4.665 7.513 4.103 8.07 4.016 8.749 C 4.005 8.833 4 8.916 4 9" />
    </svg>
  )
}

export function Arrows40({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 16.414 13 L 17.824 11.602 C 18.949 10.487 19.512 9.93 19.598 9.251 C 19.609 9.167 19.614 9.084 19.614 9 M 16.414 5 L 17.824 6.398 C 18.949 7.513 19.512 8.07 19.598 8.749 C 19.609 8.833 19.614 8.916 19.614 9 M 18 19 H 10 C 7.239 19 5 16.761 5 14 C 5 11.239 7.239 9 10 9 H 19 H 19.614" />
    </svg>
  )
}

export function Arrows41({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 19 8 H 5.251 C 5.113 8 4.998 7.887 5.016 7.749 C 5.102 7.07 5.665 6.513 6.79 5.398 L 8.2 4 M 16 20 L 17.411 18.602 C 18.535 17.487 19.098 16.93 19.184 16.251 C 19.187 16.234 19.189 16.217 19.19 16.2 C 19.201 16.09 19.111 16 19 16 H 5" />
    </svg>
  )
}

export function Arrows42({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 8 5 L 8 18.749 C 8 18.887 7.887 19.002 7.749 18.984 C 7.07 18.897 6.512 18.335 5.398 17.21 L 4 15.8 M 20 8 L 18.602 6.589 C 17.487 5.464 16.93 4.902 16.251 4.815 C 16.234 4.813 16.217 4.811 16.2 4.81 C 16.09 4.799 16 4.889 16 5 V 19" />
    </svg>
  )
}

export function Arrows43({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 13 4.192 C 12.399 4.185 11.735 4.185 11 4.185 C 7.25 4.185 5.375 4.185 4.061 5.14 C 3.637 5.448 3.263 5.821 2.955 6.246 C 2 7.56 2 9.435 2 13.185 C 2 16.934 2 18.809 2.955 20.124 C 3.263 20.548 3.637 20.921 4.061 21.23 C 5.375 22.185 7.25 22.185 11 22.185 C 14.75 22.185 16.625 22.185 17.939 21.23 C 18.363 20.921 18.737 20.548 19.045 20.124 C 20 18.809 20 16.934 20 13.185 C 20 12.449 20 11.786 19.993 11.185 M 22.557 8.084 L 22.568 5.602 C 22.576 3.623 22.581 2.633 22.057 1.956 C 21.994 1.874 21.925 1.796 21.852 1.723 C 21.777 1.648 21.698 1.578 21.614 1.513 C 20.937 0.989 19.947 0.993 17.968 1.002 L 15.486 1.013 M 10.536 13.034 L 21.827 1.742 L 21.852 1.723" />
    </svg>
  )
}
