import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0d1117]">
      <Card className="text-center max-w-md">
        <div className="text-5xl mb-4">🧭</div>
        <h1 className="font-syne text-3xl font-bold text-[#e6edf3] mb-2">Page not found</h1>
        <p className="text-[#8b949e] mb-6">
          That page doesn't exist, or it moved somewhere we haven't linked yet.
        </p>
        <Link href="/">
          <Button variant="primary">Back Home</Button>
        </Link>
      </Card>
    </div>
  )
}
