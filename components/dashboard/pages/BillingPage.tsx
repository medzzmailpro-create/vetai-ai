'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { sectionCard } from '../utils/styles'
import type { InvoiceRow } from '../types/types'

const PORTAL_URL = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL ?? '#'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  paid: { bg: '#C6F6D5', color: '#276749', label: 'Payée' },
  pending: { bg: '#FEFCBF', color: '#975A16', label: 'En attente' },
  overdue: { bg: '#FED7D7', color: '#9B2C2C', label: 'En retard' },
}

export default function BillingPage({ clinicId }: { clinicId: string }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clinicId) return

    const load = async () => {
      setLoading(true)

      try {
        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_number, amount_eur, amount, status, issued_at, created_at, invoice_pdf_url, clients(name)')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })

        if (data) {
          setInvoices(
            data.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              invoice_number: (r.invoice_number as string) ?? `FAC-${String(r.id).slice(0, 8)}`,
              amount_eur: Number(r.amount_eur ?? r.amount ?? 0),
              status: (r.status as string) ?? 'pending',
              issued_at: (r.issued_at as string) ?? (r.created_at as string) ?? '',
              invoice_pdf_url: (r.invoice_pdf_url as string) ?? '',
              client_name: ((r.clients as Record<string, string> | null)?.name) ?? '—',
            }))
          )
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [clinicId])

  const openPortal = () => {
    if (PORTAL_URL === '#') {
      alert('Portail Stripe non configuré. Ajoutez NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL dans .env.local')
      return
    }

    window.open(PORTAL_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...sectionCard, padding: 20 }}>
        <div
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            color: '#2A2A28',
            marginBottom: 16,
          }}
        >
          Facturation & Abonnement
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Plan actuel', value: 'Pack Clinique', color: '' },
            { label: 'Statut abonnement', value: 'Actif', color: '#38A169' },
            { label: 'Prochaine facturation', value: '10 avril 2026', color: '' },
            { label: 'Montant', value: '290 € / mois', color: '' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: '#F9F9F7',
                borderRadius: 8,
                padding: 14,
                border: '1px solid #EBEBEA',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#9E9E9B',
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: color || '#2A2A28' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: '#E8F5F3',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: '#0A7C6E',
          }}
        >
          Toutes les opérations de facturation sont gérées de façon sécurisée via le <strong>portail Stripe</strong>.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={openPortal}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: 'none',
              background: '#0A7C6E',
              color: 'white',
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Gérer mon abonnement →
          </button>

          <button
            onClick={openPortal}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #D4D4D2',
              background: 'white',
              color: '#5C5C59',
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Voir mes factures
          </button>

          <button
            onClick={openPortal}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #D4D4D2',
              background: 'white',
              color: '#5C5C59',
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Mettre à jour le paiement
          </button>

          <button
            onClick={openPortal}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #FFCDD2',
              background: 'white',
              color: '#C53030',
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annuler l&apos;abonnement
          </button>
        </div>
      </div>

      <div style={{ ...sectionCard, padding: 20 }}>
        <div
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: '#2A2A28',
            marginBottom: 16,
          }}
        >
          Historique des factures
        </div>

        {loading && (
          <>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  height: 44,
                  background: '#E8E8E6',
                  borderRadius: 8,
                  marginBottom: 8,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </>
        )}

        {!loading && invoices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: '#2A2A28',
                marginBottom: 4,
              }}
            >
              Aucune facture pour le moment
            </div>
            <div style={{ fontSize: 13, color: '#9E9E9B' }}>
              Vos factures apparaîtront ici après chaque paiement.
            </div>
          </div>
        )}

        {!loading && invoices.length > 0 && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 2fr 1fr 100px',
                gap: 12,
                padding: '6px 10px',
                marginBottom: 4,
              }}
            >
              {['Date', 'Client', 'Montant', 'Statut'].map(h => (
                <div
                  key={h}
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#9E9E9B',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {invoices.map(inv => {
              const style = STATUS_STYLE[inv.status] ?? {
                bg: '#F0F0EE',
                color: '#5C5C59',
                label: inv.status,
              }

              return (
                <div
                  key={inv.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 2fr 1fr 100px',
                    gap: 12,
                    padding: '10px 10px',
                    borderRadius: 8,
                    marginBottom: 4,
                    background: '#F9F9F7',
                    border: '1px solid #EBEBEA',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 13, color: '#5C5C59' }}>
                    {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('fr-FR') : '—'}
                  </div>

                  <div style={{ fontSize: 13, color: '#2A2A28', fontWeight: 500 }}>
                    {inv.client_name}
                  </div>

                  <div style={{ fontSize: 13, color: '#2A2A28', fontWeight: 700 }}>
                    {Number(inv.amount_eur ?? 0).toFixed(2)} €
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: style.bg,
                        color: style.color,
                      }}
                    >
                      {style.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}