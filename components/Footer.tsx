import { CONTACT_EMAIL } from '@/lib/data'

const linkStyle = { fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' as const, transition: 'color 0.2s' }

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a href={href} style={linkStyle}
        onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
        onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}>
        {label}
      </a>
    </li>
  )
}

export default function Footer() {
  return (
    <footer style={{ background: '#141412', color: 'rgba(255,255,255,0.6)', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }} className="footer-grid-resp">

          {/* Col 1 — Brand */}
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              Vetai<div style={{ width: 8, height: 8, background: '#F5A623', borderRadius: '50%' }} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
              L'assistant IA vétérinaire qui automatise vos communications et libère votre équipe pour soigner.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {CONTACT_EMAIL}
            </p>
          </div>

          {/* Col 2 — Produit */}
          <div>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 16 }}>Produit</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FooterLink href="#agents" label="Fonctionnalités" />
              <FooterLink href="#how" label="Comment ça marche" />
              <FooterLink href="/security-rgpd" label="Sécurité & RGPD" />
            </ul>
          </div>

          {/* Col 3 — Tarifs */}
          <div>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 16 }}>Tarifs</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FooterLink href="/pricing" label="La Sentinelle" />
              <FooterLink href="/pricing" label="Programme Pilote" />
              <FooterLink href="/pricing" label="Demander une démo" />
            </ul>
          </div>

          {/* Col 4 — Légal */}
          <div>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 16 }}>Légal</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FooterLink href="/mentions-legales" label="Mentions légales" />
              <FooterLink href="/privacy" label="Politique de confidentialité" />
              <FooterLink href="/rgpd-dpa" label="RGPD / DPA" />
              <FooterLink href="/cgu-cgv" label="CGU / CGV" />
            </ul>
            <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              🔒 Données hébergées en France<br />⚖️ Conforme RGPD
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13 }}>© 2026 Vetai. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Mentions légales', href: '/mentions-legales' },
              { label: 'Politique de confidentialité', href: '/privacy' },
              { label: 'CGU / CGV', href: '/cgu-cgv' },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{l.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
