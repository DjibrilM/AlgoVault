import type { IconProps } from '../types'

export function LikeSupport1({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 5.5 20.5 C 4.119 20.5 3 19.381 3 18 V 10 C 3 8.619 4.119 7.5 5.5 7.5 C 6.881 7.5 8 8.619 8 10 V 18 C 8 19.381 6.881 20.5 5.5 20.5 Z M 9.345 8.315 L 11.575 4.69 C 11.839 4.261 12.307 4 12.81 4 C 13.699 4 14.378 4.792 14.243 5.67 L 14 7.25 C 13.737 8.959 15.059 10.5 16.788 10.5 H 17.478 C 20.015 10.5 21.665 13.17 20.531 15.439 L 19.382 17.736 C 18.535 19.43 16.804 20.5 14.91 20.5 H 12 C 9.791 20.5 8 18.709 8 16.5 V 13.066 C 8 11.923 8 11.352 8.125 10.803 C 8.163 10.636 8.21 10.47 8.266 10.308 C 8.447 9.774 8.746 9.288 9.345 8.315 Z" />
    </svg>
  )
}
export const Heart = LikeSupport1
export const Like = LikeSupport1

export function LikeSupport2({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 5.5 4 C 4.119 4 3 5.119 3 6.5 V 14.5 C 3 15.881 4.119 17 5.5 17 C 6.881 17 8 15.881 8 14.5 V 6.5 C 8 5.119 6.881 4 5.5 4 Z M 9.345 16.185 L 11.575 19.81 C 11.839 20.239 12.307 20.5 12.81 20.5 C 13.699 20.5 14.378 19.708 14.243 18.83 L 14 17.25 C 13.737 15.541 15.059 14 16.788 14 H 17.478 C 20.015 14 21.665 11.33 20.53 9.061 L 19.382 6.764 C 18.535 5.07 16.804 4 14.91 4 H 12 C 9.791 4 8 5.791 8 8 V 11.434 C 8 12.577 8 13.148 8.125 13.697 C 8.163 13.864 8.21 14.03 8.266 14.192 C 8.447 14.726 8.746 15.212 9.345 16.185 Z" />
    </svg>
  )
}
export const Dislike = LikeSupport2

export function LikeSupport3({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 5.098 7.015 C 6.67 7.015 8.063 6.002 8.549 4.507 C 9.635 1.164 14.365 1.164 15.451 4.507 C 15.937 6.002 17.33 7.015 18.902 7.015 C 22.417 7.015 23.879 11.513 21.035 13.579 C 19.763 14.503 19.231 16.141 19.717 17.636 C 20.803 20.979 16.977 23.759 14.133 21.693 C 12.861 20.769 11.139 20.769 9.867 21.693 C 7.023 23.759 3.197 20.979 4.283 17.636 C 4.769 16.141 4.237 14.503 2.965 13.579 C 0.121 11.513 1.583 7.015 5.098 7.015 Z" />
    </svg>
  )
}
export const Star = LikeSupport3

export function LikeSupport4({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 14 7.886 C 14.323 8.839 15.248 9.484 16.292 9.484 M 5.098 7.015 C 6.67 7.015 8.063 6.002 8.549 4.507 C 9.635 1.164 14.365 1.164 15.451 4.507 C 15.937 6.002 17.33 7.015 18.902 7.015 C 22.417 7.015 23.879 11.513 21.035 13.579 C 19.763 14.503 19.231 16.141 19.717 17.636 C 20.803 20.979 16.977 23.759 14.133 21.693 C 12.861 20.769 11.139 20.769 9.867 21.693 C 7.023 23.759 3.197 20.979 4.283 17.636 C 4.769 16.141 4.237 14.503 2.965 13.579 C 0.121 11.513 1.583 7.015 5.098 7.015 Z" />
    </svg>
  )
}

export function LikeSupport5({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 13.601 4.146 C 15.274 3.084 17.977 2.08 20.311 4.461 C 25.852 10.111 16.35 21 12 21 C 7.65 21 -1.852 10.111 3.689 4.461 C 6.023 2.08 8.726 3.084 10.399 4.146 C 11.345 4.746 12.655 4.746 13.601 4.146 Z" />
    </svg>
  )
}

export function LikeSupport6({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 5 8.777 C 5.207 8.106 5.577 7.476 6.145 6.913 C 6.593 6.469 7.057 6.177 7.522 6 M 13.601 4.146 C 15.274 3.084 17.977 2.08 20.311 4.461 C 25.852 10.111 16.35 21 12 21 C 7.65 21 -1.852 10.111 3.689 4.461 C 6.023 2.08 8.726 3.084 10.399 4.146 C 11.345 4.746 12.655 4.746 13.601 4.146 Z" />
    </svg>
  )
}

export function LikeSupport7({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 19 8.777 C 18.793 8.106 18.423 7.476 17.855 6.913 C 17.408 6.469 16.943 6.177 16.478 6 M 10.399 4.146 C 8.726 3.084 6.023 2.08 3.689 4.461 C -1.852 10.111 7.65 21 12 21 C 16.35 21 25.852 10.111 20.311 4.461 C 17.977 2.08 15.274 3.084 13.601 4.146 C 12.655 4.746 11.345 4.746 10.399 4.146 Z" />
    </svg>
  )
}

export function LikeSupport8({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 11.669 18.951 L 9.058 20.815 C 8.163 21.455 6.987 20.531 7.396 19.51 C 7.685 18.787 7.153 18 6.373 18 H 5.772 C 3.689 18 2 16.311 2 14.228 V 10 C 2 7.2 2 5.8 2.545 4.73 C 3.024 3.789 3.789 3.024 4.73 2.545 C 5.8 2 7.2 2 10 2 H 14 C 16.8 2 18.2 2 19.27 2.545 C 20.211 3.024 20.976 3.789 21.455 4.73 C 22 5.8 22 7.2 22 10 V 11.184 C 22 12.873 22 13.718 21.798 14.407 C 21.319 16.041 20.041 17.319 18.407 17.798 C 17.718 18 16.873 18 15.184 18 H 14.635 C 14.603 18 14.586 18 14.57 18 C 13.55 18.007 12.556 18.325 11.722 18.913 C 11.709 18.922 11.696 18.932 11.669 18.951 Z M 12.8 6.573 C 13.637 6.042 14.989 5.54 16.156 6.73 C 18.926 9.556 14.175 15 12 15 C 9.825 15 5.074 9.556 7.844 6.73 C 9.011 5.54 10.363 6.042 11.2 6.573 C 11.672 6.873 12.327 6.873 12.8 6.573 Z" />
    </svg>
  )
}

export function LikeSupport9({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 8.799 18.674 L 9.118 19.006 C 10.472 20.413 11.149 21.116 12 21.116 C 12.851 21.116 13.528 20.413 14.882 19.006 L 15.201 18.674 C 15.205 18.67 15.207 18.668 15.209 18.666 C 15.396 18.474 15.652 18.365 15.92 18.364 C 15.923 18.364 15.926 18.364 15.931 18.364 C 15.995 18.364 16.027 18.364 16.054 18.363 C 18.773 18.334 20.97 16.137 21 13.418 C 21 13.391 21 13.359 21 13.295 V 10.182 C 21 7.21 21 5.724 20.388 4.604 C 19.929 3.762 19.238 3.071 18.396 2.612 C 17.276 2 15.79 2 12.818 2 H 11.182 C 8.21 2 6.724 2 5.604 2.612 C 4.762 3.071 4.071 3.762 3.612 4.604 C 3 5.724 3 7.21 3 10.182 V 13.295 C 3 13.359 3 13.391 3 13.418 C 3.03 16.137 5.227 18.334 7.946 18.363 C 7.973 18.364 8.005 18.364 8.069 18.364 C 8.074 18.364 8.077 18.364 8.08 18.364 C 8.348 18.365 8.604 18.474 8.791 18.666 C 8.793 18.668 8.795 18.67 8.799 18.674 Z M 12.8 6.573 C 13.637 6.042 14.989 5.54 16.156 6.73 C 18.926 9.556 14.175 15 12 15 C 9.825 15 5.074 9.556 7.844 6.73 C 9.011 5.54 10.363 6.042 11.2 6.573 C 11.672 6.873 12.327 6.873 12.8 6.573 Z" />
    </svg>
  )
}

export function LikeSupport10({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 12.669 18.951 L 10.058 20.815 C 9.163 21.455 7.987 20.531 8.396 19.51 C 8.685 18.787 8.153 18 7.373 18 H 6.772 C 4.689 18 3 16.311 3 14.228 V 10 C 3 7.2 3 5.8 3.545 4.73 C 4.024 3.789 4.789 3.024 5.73 2.545 C 6.8 2 8.2 2 11 2 H 13 C 15.8 2 17.2 2 18.27 2.545 C 19.211 3.024 19.976 3.789 20.455 4.73 C 21 5.8 21 7.2 21 10 V 12.699 C 21 12.978 21 13.118 20.994 13.236 C 20.872 15.812 18.812 17.872 16.236 17.994 C 16.118 18 15.962 18 15.65 18 C 15.608 18 15.586 18 15.57 18 C 14.55 18.007 13.556 18.325 12.722 18.913 C 12.709 18.922 12.696 18.932 12.669 18.951 Z M 12.8 6.573 C 13.637 6.042 14.989 5.54 16.156 6.73 C 18.926 9.556 14.175 15 12 15 C 9.825 15 5.074 9.556 7.844 6.73 C 9.011 5.54 10.363 6.042 11.2 6.573 C 11.672 6.873 12.327 6.873 12.8 6.573 Z" />
    </svg>
  )
}

export function LikeSupport11({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 7.885 16.384 C 8.832 17.636 10.299 19 12 19 C 13.701 19 15.168 17.636 16.115 16.384 C 16.568 15.786 16.105 15 15.355 15 H 8.645 C 7.895 15 7.432 15.786 7.885 16.384 Z M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z M 15.9 7.255 C 16.319 7.019 16.994 6.796 17.578 7.325 C 18.963 8.58 16.588 11 15.5 11 C 14.412 11 12.037 8.58 13.422 7.325 C 14.006 6.796 14.681 7.019 15.1 7.255 C 15.336 7.388 15.664 7.388 15.9 7.255 Z M 8.9 7.255 C 9.319 7.019 9.994 6.796 10.578 7.325 C 11.963 8.58 9.588 11 8.5 11 C 7.412 11 5.037 8.58 6.422 7.325 C 7.006 6.796 7.681 7.019 8.1 7.255 C 8.336 7.388 8.664 7.388 8.9 7.255 Z" />
    </svg>
  )
}

export function LikeSupport12({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 7 14 C 7.667 15.286 9.6 17 12 17 C 14.4 17 16.333 15.286 17 14 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
      <path d="M 10 8 C 10 8.552 9.552 9 9 9 C 8.448 9 8 8.552 8 8 C 8 7.448 8.448 7 9 7 C 9.552 7 10 7.448 10 8 Z" />
      <path d="M 16 8 C 16 8.552 15.552 9 15 9 C 14.448 9 14 8.552 14 8 C 14 7.448 14.448 7 15 7 C 15.552 7 16 7.448 16 8 Z" />
    </svg>
  )
}

export function LikeSupport13({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 7 17 C 7.667 15.714 9.6 14 12 14 C 14.4 14 16.333 15.714 17 17 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
      <path d="M 10 8 C 10 8.552 9.552 9 9 9 C 8.448 9 8 8.552 8 8 C 8 7.448 8.448 7 9 7 C 9.552 7 10 7.448 10 8 Z" />
      <path d="M 16 8 C 16 8.552 15.552 9 15 9 C 14.448 9 14 8.552 14 8 C 14 7.448 14.448 7 15 7 C 15.552 7 16 7.448 16 8 Z" />
    </svg>
  )
}

export function LikeSupport14({ size = 24, className, ...props }: IconProps) {
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
      <path d="M 10 9 C 10 9.552 9.552 10 9 10 C 8.448 10 8 9.552 8 9 C 8 8.448 8.448 8 9 8 C 9.552 8 10 8.448 10 9 Z" />
      <path d="M 16 9 C 16 9.552 15.552 10 15 10 C 14.448 10 14 9.552 14 9 C 14 8.448 14.448 8 15 8 C 15.552 8 16 8.448 16 9 Z" />
      <path d="M 8 16 H 16 M 22 12 C 22 17.523 17.523 22 12 22 C 6.477 22 2 17.523 2 12 C 2 6.477 6.477 2 12 2 C 17.523 2 22 6.477 22 12 Z" />
    </svg>
  )
}
