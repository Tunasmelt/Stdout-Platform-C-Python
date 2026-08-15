'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        // After signup, redirect to login or dashboard
        router.push('/login?message=Account created. Please check your email to confirm.')
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
          Sign up
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <span className="text-[#8b949e] text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-[#f78166] hover:underline">
            Log in
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
