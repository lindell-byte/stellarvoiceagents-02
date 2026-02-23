import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stellar Voice Agents',
  description: 'Manage Leads/Enquiries',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
