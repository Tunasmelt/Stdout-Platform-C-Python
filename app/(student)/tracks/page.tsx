'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Track } from '@/types/index'

export default function TracksPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('tracks')
          .select('*')
          .order('created_at')

        if (fetchError) throw fetchError
        setTracks(data || [])
      } catch (err) {
        console.error('Error loading tracks:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tracks')
      } finally {
        setIsLoading(false)
      }
    }

    loadTracks()
  }, [supabase])

  const handleSelectTrack = (trackId: string) => {
    router.push(`/assessment?track=${trackId}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-[#8b949e]">Loading tracks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-syne text-4xl font-bold mb-2 text-[#e6edf3]">Choose a Track</h1>
      <p className="text-[#8b949e] mb-12">Pick a language and we&apos;ll assess your level.</p>

      {tracks.length === 0 ? (
        <Card>
          <p className="text-center text-[#8b949e]">No tracks available yet.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {tracks.map((track) => (
            <Card key={track.id} className="flex flex-col">
              <CardHeader>
                <div className="text-5xl mb-2">{track.icon || '📚'}</div>
                <CardTitle as="h2">{track.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-[#8b949e] mb-6">{track.description}</p>
                <Button
                  onClick={() => handleSelectTrack(track.id)}
                  variant="primary"
                  className="w-full"
                >
                  Start {track.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
