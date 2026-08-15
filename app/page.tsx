import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <Navbar user={user} />
      <div className="bg-[#0d1117] min-h-screen">
        {/* Hero section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="font-syne text-4xl sm:text-5xl lg:text-6xl font-bold text-[#e6edf3] mb-6">
              Learn to Code.
              <br />
              <span className="text-[#f78166]">Master</span> C, C++, and Python.
            </h1>
            <p className="font-ibm-plex-sans text-lg sm:text-xl text-[#8b949e] mb-8 max-w-2xl mx-auto">
              CodeLearn is an interactive, scaffolded programming platform inspired by freeCodeCamp.
              Pick a language, complete a skill assessment, and start learning from your level.
            </p>
            <div className="flex gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button variant="primary" size="lg">
                      Start Learning
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="bg-[#161b22] border-y border-[#30363d] py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-syne text-4xl font-bold text-center mb-12 text-[#e6edf3]">
              Learn Your Way
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-8">
                <div className="text-3xl mb-4">⚙️</div>
                <h3 className="font-syne text-xl font-bold mb-4 text-[#e6edf3]">
                  C & C++
                </h3>
                <p className="text-[#8b949e]">
                  Systems programming from fundamentals to object-oriented design. 13 chapters of hands-on lessons.
                </p>
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-8">
                <div className="text-3xl mb-4">🐍</div>
                <h3 className="font-syne text-xl font-bold mb-4 text-[#e6edf3]">
                  Python
                </h3>
                <p className="text-[#8b949e]">
                  From zero to confident developer. Practical, readable code that builds real skills.
                </p>
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-8">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="font-syne text-xl font-bold mb-4 text-[#e6edf3]">
                  Write & Run
                </h3>
                <p className="text-[#8b949e]">
                  Write code in your browser. Run it instantly. Get feedback in real time. No setup needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-syne text-4xl font-bold mb-6 text-[#e6edf3]">
              Ready to start?
            </h2>
            <p className="text-[#8b949e] text-lg mb-8">
              Join thousands of students learning to code at their own pace.
            </p>
            {!user && (
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Create Your Free Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
