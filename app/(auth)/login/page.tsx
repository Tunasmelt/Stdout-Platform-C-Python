'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="text-center">
          Log in
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#f78166]"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#f78166]"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <span className="text-[#8b949e] text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#f78166] hover:underline">
            Sign up
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
