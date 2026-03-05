/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez votre email pour Weshkech</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://pyocqorzbsshawgknmpr.supabase.co/storage/v1/object/public/email-assets/logo.png"
          width="56"
          height="56"
          alt="Weshkech"
          style={logo}
        />
        <Heading style={h1}>Bienvenue sur Weshkech 🎉</Heading>
        <Text style={text}>
          Merci de rejoindre{' '}
          <Link href={siteUrl} style={link}>
            <strong>Weshkech</strong>
          </Link>{' '}
          — l'énergie de Marrakech, sans filtre et en temps réel.
        </Text>
        <Text style={text}>
          Confirmez votre adresse email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) pour accéder à la carte live, aux vibes et à votre Pass Invité.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmer mon email
        </Button>
        <Text style={footer}>
          Si vous n'avez pas créé de compte, ignorez simplement cet email.
        </Text>
        <Text style={brand}>Weshkech · Marrakech Live Vibes</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  fontFamily: "'Playfair Display', Georgia, serif",
  color: '#1a1a1a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: '#C4952E', textDecoration: 'underline' }
const button = {
  backgroundColor: '#C4952E',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '20px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
const brand = { fontSize: '11px', color: '#C4952E', margin: '8px 0 0', fontStyle: 'italic' as const }
