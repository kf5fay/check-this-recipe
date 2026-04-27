import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/nav/Navbar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Check This Recipe',
  description: 'Save, share, and plan meals with friends',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-100">
        {user && <Navbar user={user} />}
        <main className={user ? 'pt-16' : ''}>
          {children}
        </main>
      </body>
    </html>
  )
}
