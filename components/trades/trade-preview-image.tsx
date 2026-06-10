'use client'

import Image from 'next/image'
import type { ImageProps } from 'next/image'
import type { SyntheticEvent } from 'react'
import { cn } from '@/lib/utils'
import { getTradePreviewTransformStyles } from '@/lib/trade-preview'

interface TradePreviewImageProps {
  src: string
  alt: string
  transform?: unknown
  className?: string
  imageClassName?: string
  sizes?: string
  priority?: boolean
  loading?: ImageProps['loading']
  unoptimized?: boolean
  onLoad?: (event: SyntheticEvent<HTMLImageElement, Event>) => void
  onError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void
}

export function TradePreviewImage({
  src,
  alt,
  transform,
  className,
  imageClassName,
  sizes,
  priority,
  loading,
  unoptimized,
  onLoad,
  onError,
}: TradePreviewImageProps) {
  const { imageStyle } = getTradePreviewTransformStyles(transform)

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={loading}
        unoptimized={unoptimized}
        draggable={false}
        className={cn('select-none object-cover', imageClassName)}
        style={imageStyle}
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  )
}
