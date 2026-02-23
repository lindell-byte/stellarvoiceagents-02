'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <div className="landing">
      <div className="landing-top">
        <button className="btn-logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
      <div className="landing-header">
        <h1>Stellar Voice Agents</h1>
        <p className="subtitle">Manage your Leads and Enquiries</p>
      </div>
      <div className="landing-cards">
        <Link href="/upload" className="landing-card">
          <div className="landing-card-icon">&#128196;</div>
          <h2>Upload Leads</h2>
          <p>Upload a CSV file to add new Leads/Enquiries to the system</p>
          <span className="landing-card-action">Go to Upload &rarr;</span>
        </Link>
        <Link href="/leads" className="landing-card">
          <div className="landing-card-icon">&#128203;</div>
          <h2>Leads List</h2>
          <p>View, search, edit, and manage all your Leads/Enquiries</p>
          <span className="landing-card-action">View List &rarr;</span>
        </Link>
      </div>
    </div>
  )
}
