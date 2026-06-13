'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CopyIcon, RefreshCwIcon, EyeIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { generateThorToken } from "@/server/thor"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useUserStore } from "@/store/user-store"

export function ThorSync({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Handle video playback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Reset video state
    video.pause()
    video.currentTime = 0

    // Play video when component mounts
    const playVideo = () => {
      video.play().catch((error) => {
        console.error('Video playback error:', error)
      })
    }

    // Play video when it's ready
    if (video.readyState >= 2) {
      playVideo()
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true })
    }

    // Cleanup
    return () => {
      if (video) {
        video.pause()
        video.removeEventListener('loadeddata', () => {})
      }
    }
  }, [])

  const handleGenerateToken = async () => {
    try {
      setIsGenerating(true)
      setIsRevealed(false)
      const result = await generateThorToken()
      if (result.error || !result.token) {
        toast.error('Failed to generate Thor API Token')
        return
      }
      if (!user) return
      setUser({ ...user, thorToken: result.token })
      toast.success('Thor API Token generated successfully')
    } catch (error) {
      toast.error('Failed to generate Thor API Token')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToken = () => {
    if (!user?.thorToken) return
    navigator.clipboard.writeText(user.thorToken)
    toast.success('API Token copied to clipboard')
  }

  const getMaskedToken = () => {
    if (!user?.thorToken) return ''
    return '•'.repeat(user.thorToken.length)
  }

  return (
    <div className="flex flex-col space-y-4 p-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-lg font-semibold">Thor Copy Trader Sync</h2>
        <p className="text-sm text-muted-foreground">
          Connect Thor Copy Trader to automatically sync your trades in real-time. Thor runs as a local background process on your machine and forwards execution events directly to our API.
        </p>
      </div>

      <div className="flex space-x-2">
        {isGenerating ? (
          <Skeleton className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" />
        ) : (
          <Input
            value={isRevealed ? (user?.thorToken || '') : getMaskedToken()}
            readOnly
            placeholder="No API token generated yet"
            className="font-mono"
          />
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={!user?.thorToken || isGenerating}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reveal Thor API Token</AlertDialogTitle>
              <AlertDialogDescription>
                Your API token grants write access to import trades into your account. Do not share this token or expose it on public screens.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsRevealed(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setIsRevealed(true)}>Reveal</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyToken}
          disabled={!user?.thorToken || isGenerating}
        >
          <CopyIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleGenerateToken}
          disabled={isGenerating}
        >
          <RefreshCwIcon className={cn("h-4 w-4", {
            "animate-spin": isGenerating
          })} />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Note: Generating a new token will immediately invalidate your previous Thor integration token. Ensure you update the token in your local Thor agent settings.</p>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">How to set up Thor</h2>
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 transition-transform duration-300 hover:scale-[1.02]">
          <video
            ref={videoRef}
            height="600"
            width="600"
            preload="metadata"
            loop
            muted
            controls
            playsInline
            className="rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg w-full h-full object-cover"
          >
            <source src="/videos/thor-tutorial.mp4" type="video/mp4" />
            <track
              src="/path/to/captions.vtt"
              kind="subtitles"
              srcLang="en"
              label="English"
            />
            Your browser does not support the video tag.
          </video>
        </div>
        <p className="text-sm text-muted-foreground">
          Download and install the Thor copier software, copy your API token, and paste it into the Thor configurations. Ensure your copier is active during trading hours.
        </p>
      </div>
    </div>
  )
}
