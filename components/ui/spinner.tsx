import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl"
}

const sizeMap = {
  xxs: "h-3 w-3",
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <div
      className={cn("inline-flex shrink-0 items-center justify-center", sizeMap[size], className)}
      {...props}
    >
      <div className="relative size-full">
        <span className="absolute rounded-[50px] animate-luma-spin shadow-[inset_0_0_0_3px] shadow-foreground/20" />
        <span className="absolute rounded-[50px] animate-luma-spin animation-delay-half shadow-[inset_0_0_0_3px] shadow-foreground/20" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
