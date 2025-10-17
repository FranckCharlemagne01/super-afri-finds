import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  firstName: string
  verificationUrl: string
}

export const WelcomeEmail = ({
  firstName,
  verificationUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Vérifiez votre compte Djassa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bienvenue sur Djassa ! 👋</Heading>
        
        <Text style={text}>
          Bonjour <strong>{firstName}</strong>,
        </Text>

        <Text style={text}>
          Merci pour votre inscription sur <strong>Djassa</strong>, la plateforme e-commerce 100 % ivoirienne !
        </Text>

        <Text style={text}>
          <strong>Veuillez cliquer sur le lien ci-dessous pour vérifier votre compte :</strong>
        </Text>

        <Section style={buttonContainer}>
          <Link href={verificationUrl} style={button}>
            Vérifier mon compte
          </Link>
        </Section>

        <Text style={warningText}>
          ⚠️ <strong>Ce lien expirera dans 15 minutes.</strong>
        </Text>

        <Text style={text}>
          Si vous n'avez pas créé de compte sur Djassa, vous pouvez ignorer cet email en toute sécurité.
        </Text>

        <Section style={contactSection}>
          <Text style={contactText}>
            Besoin d'aide ?<br />
            📧 <Link href="mailto:support@djassa.tech" style={link}>support@djassa.tech</Link><br />
            📱 WhatsApp : <Link href="https://wa.me/2250788281222" style={link}>+225 07 88 28 12 22</Link>
          </Text>
        </Section>

        <Text style={signature}>
          Cordialement,<br />
          L'équipe Djassa
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '40px 20px 20px',
  margin: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 20px',
  margin: '10px 0',
}

const warningText = {
  color: '#d97706',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '10px 20px',
  margin: '10px 0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  padding: '20px 20px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#2563EB',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
}

const contactSection = {
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  margin: '20px',
}

const contactText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
}

const link = {
  color: '#2563EB',
  textDecoration: 'none',
}

const signature = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  padding: '0 20px',
  textAlign: 'center' as const,
  marginTop: '30px',
}
