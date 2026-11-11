import type { IconProps } from '../types'

export function Time1({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 11 8 V 11.5 C 11 12.328 11.672 13 12.5 13 H 14 M 21 14 V 10 M 16.882 4.914 C 16.386 2.675 14.389 1 12 1 H 10 C 7.612 1 5.614 2.675 5.118 4.914 M 16.882 4.914 C 16.688 4.777 16.483 4.654 16.27 4.545 C 15.2 4 13.8 4 11 4 C 8.2 4 6.8 4 5.73 4.545 C 5.517 4.654 5.312 4.777 5.118 4.914 M 5.118 4.914 C 4.457 5.38 3.916 6.003 3.545 6.73 C 3 7.8 3 9.2 3 12 C 3 14.8 3 16.2 3.545 17.27 C 3.916 17.997 4.457 18.619 5.118 19.086 C 5.312 19.223 5.517 19.346 5.73 19.455 C 6.8 20 8.2 20 11 20 C 13.8 20 15.2 20 16.27 19.455 C 16.483 19.346 16.688 19.223 16.882 19.086 C 17.543 18.62 18.084 17.997 18.455 17.27 C 19 16.2 19 14.8 19 12 C 19 9.2 19 7.8 18.455 6.73 C 18.084 6.003 17.543 5.38 16.882 4.914 M 5.118 19.086 C 5.614 21.325 7.611 23 10 23 H 12 C 14.388 23 16.385 21.325 16.882 19.086" />
    </svg>
  )
}
export const Clock = Time1

export function Time2({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 19 12 C 19 14.8 19 16.2 18.455 17.27 C 17.976 18.211 17.211 18.976 16.27 19.455 C 15.2 20 13.8 20 11 20 C 8.2 20 6.8 20 5.73 19.455 C 4.789 18.976 4.024 18.211 3.545 17.27 C 3 16.2 3 14.8 3 12 C 3 9.2 3 7.8 3.545 6.73 C 4.024 5.789 4.789 5.024 5.73 4.545 C 6.8 4 8.2 4 11 4 C 13.8 4 15.2 4 16.27 4.545 C 17.211 5.024 17.976 5.789 18.455 6.73 C 19 7.8 19 9.2 19 12 Z M 19 12 H 21 M 11 8 V 11.5 C 11 12.328 11.672 13 12.5 13 H 14 M 7 2 H 15 M 7 22 H 15" />
    </svg>
  )
}
export const Calendar = Time2

export function Time3({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 9 14 H 15 M 15 5 V 4.029 M 15 2 V 4.029 M 9 5 V 4.029 M 9 2 V 4.029 M 20.971 16 C 20.061 16 19.602 16.001 19.218 16.062 C 17.078 16.4 15.4 18.078 15.062 20.218 C 15.001 20.602 15 21.061 15 21.971 M 15 21.971 C 16.864 21.907 18.034 21.702 18.939 21.045 C 19.363 20.737 19.737 20.363 20.045 19.939 C 20.702 19.034 20.907 17.864 20.971 16 C 21 15.156 21 14.169 21 13 C 21 11.831 21 10.844 20.971 10 C 20.907 8.136 20.702 6.966 20.045 6.061 C 19.737 5.637 19.363 5.263 18.939 4.955 C 18.034 4.298 16.864 4.093 15 4.029 M 9 4.029 C 7.136 4.093 5.966 4.298 5.061 4.955 C 4.637 5.263 4.263 5.637 3.955 6.061 C 3.298 6.966 3.093 8.136 3.029 10 C 3 10.844 3 11.831 3 13 C 3 16.75 3 18.625 3.955 19.939 C 4.263 20.363 4.637 20.737 5.061 21.045 C 6.375 22 8.25 22 12 22 C 13.169 22 14.156 22 15 21.971 M 3.029 10 H 20.971 M 15 4.029 C 14.156 4 13.169 4 12 4 C 10.831 4 9.844 4 9 4.029" />
    </svg>
  )
}
export const Timer = Time3

export function Time4({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 15 5 V 4.029 M 15 2 V 4.029 M 9 5 V 4.029 M 9 2 V 4.029 M 9 4.029 C 9.844 4 10.831 4 12 4 C 13.169 4 14.156 4 15 4.029 M 15 4.029 C 16.864 4.093 18.034 4.298 18.939 4.955 C 19.363 5.263 19.737 5.637 20.045 6.061 C 21 7.375 21 9.25 21 13 C 21 14.169 21 15.156 20.971 16 C 20.907 17.864 20.702 19.034 20.045 19.939 C 19.737 20.363 19.363 20.737 18.939 21.045 C 18.034 21.702 16.864 21.907 15 21.971 C 14.156 22 13.169 22 12 22 C 8.25 22 6.375 22 5.061 21.045 C 4.637 20.737 4.263 20.363 3.955 19.939 C 3 18.625 3 16.75 3 13 C 3 9.25 3 7.375 3.955 6.061 C 4.263 5.637 4.637 5.263 5.061 4.955 C 5.966 4.298 7.136 4.093 9 4.029 M 20.971 16 C 20.061 16 19.602 16.001 19.218 16.062 C 17.078 16.4 15.4 18.078 15.062 20.218 C 15.001 20.602 15 21.061 15 21.971" />
      <path d="M 8 9 C 8 9.552 7.552 10 7 10 C 6.448 10 6 9.552 6 9 C 6 8.448 6.448 8 7 8 C 7.552 8 8 8.448 8 9 Z" />
      <path d="M 8 13 C 8 13.552 7.552 14 7 14 C 6.448 14 6 13.552 6 13 C 6 12.448 6.448 12 7 12 C 7.552 12 8 12.448 8 13 Z" />
      <path d="M 13 9 C 13 9.552 12.552 10 12 10 C 11.448 10 11 9.552 11 9 C 11 8.448 11.448 8 12 8 C 12.552 8 13 8.448 13 9 Z" />
      <path d="M 13 13 C 13 13.552 12.552 14 12 14 C 11.448 14 11 13.552 11 13 C 11 12.448 11.448 12 12 12 C 12.552 12 13 12.448 13 13 Z" />
      <path d="M 13 17 C 13 17.552 12.552 18 12 18 C 11.448 18 11 17.552 11 17 C 11 16.448 11.448 16 12 16 C 12.552 16 13 16.448 13 17 Z" />
      <path d="M 18 9 C 18 9.552 17.552 10 17 10 C 16.448 10 16 9.552 16 9 C 16 8.448 16.448 8 17 8 C 17.552 8 18 8.448 18 9 Z" />
      <path d="M 18 13 C 18 13.552 17.552 14 17 14 C 16.448 14 16 13.552 16 13 C 16 12.448 16.448 12 17 12 C 17.552 12 18 12.448 18 13 Z" />
      <path d="M 8 17 C 8 17.552 7.552 18 7 18 C 6.448 18 6 17.552 6 17 C 6 16.448 6.448 16 7 16 C 7.552 16 8 16.448 8 17 Z" />
    </svg>
  )
}

export function Time5({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 8.25 V 12.456 C 12 12.966 11.805 13.457 11.455 13.828 L 10 15.371 M 3 3.25 L 5.5 1.25 M 21 3.25 L 18.5 1.25 M 22 12.25 C 22 17.773 17.523 22.25 12 22.25 C 6.477 22.25 2 17.773 2 12.25 C 2 6.727 6.477 2.25 12 2.25 C 17.523 2.25 22 6.727 22 12.25 Z" />
    </svg>
  )
}

export function Time6({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 7 V 12 C 12 12.045 12.054 12.067 12.086 12.036 L 14.121 10 M 3 3.25 L 5.5 1.25 M 21 3.25 L 18.5 1.25 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Time7({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 8 L 12 10.691 C 12 11.818 12 12.381 12.268 12.845 C 12.536 13.309 13.024 13.591 14 14.155 L 14.598 14.5 M 3 3.25 L 5.5 1.25 M 21 3.25 L 18.5 1.25 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Time8({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 8 L 12 12.293 C 12 12.554 11.685 12.685 11.5 12.5 L 10 11 M 3 3.25 L 5.5 1.25 M 21 3.25 L 18.5 1.25 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Time9({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 8 L 12 11.5 C 12 12.328 11.328 13 10.5 13 H 9 M 3 3.25 L 5.5 1.25 M 21 3.25 L 18.5 1.25 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}

export function Time10({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12 8 L 12 11.5 C 12 12.328 12.672 13 13.5 13 H 15 M 3 3.25 L 5.5 1.25 M 21 3.25 L 18.5 1.25 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}
