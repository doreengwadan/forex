// components/ui/Avatar.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false)

  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 ${className}`}
      {...props}
    >
      {src && !error ? (
        <Image
          src={src}
          alt={alt || ''}
          fill
          className="aspect-square h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-600">
          {fallback || alt?.charAt(0) || '?'}
        </div>
      )}
    </div>
  )
}

export const AvatarImage = Image
export const AvatarFallback = ({ children }: { children: React.ReactNode }) => <>{children}</>