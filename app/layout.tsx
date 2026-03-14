import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://vetai.ai'),
  title: 'Vetai.AI — Réceptionniste IA pour cliniques vétérinaires',
  description: 'Vetai.AI répond à vos appels, gère vos RDV et envoie les rappels vaccins automatiquement. 24h/24, 7j/7.',
  openGraph: {
    title: 'Vetai.AI — Zéro appel manqué. IA vétérinaire 24h/24.',
    description: "L'assistant IA qui travaille pendant que vous soignez. +35% de RDV estimés, -60% de no-shows estimés, 2h récupérées par jour par ASV.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://vetai.ai',
    siteName: 'Vetai.AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vetai.AI — Assistant IA Vétérinaire',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vetai.AI — IA vétérinaire 24h/24',
    description: 'Zéro appel manqué. +35% de RDV estimés. -60% de no-shows estimés.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
