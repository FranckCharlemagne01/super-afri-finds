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
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  firstName: string
  confirmationUrl: string
}

export const WelcomeEmail = ({
  firstName,
  confirmationUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenue sur Djassa – Votre aventure e-commerce commence maintenant 🚀</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bienvenue sur Djassa 🚀</Heading>
        
        <Text style={text}>
          Bonjour <strong>{firstName}</strong>,
        </Text>

        <Text style={text}>
          Bienvenue sur <strong>Djassa</strong>, la marketplace #1 en Côte d'Ivoire !
        </Text>

        <Text style={text}>
          Vous pouvez dès maintenant explorer nos offres, acheter ou créer votre propre boutique gratuitement pendant 28 jours.
        </Text>

        <Section style={buttonContainer}>
          <Button href="https://djassa.tech/login" style={button}>
            🔗 Accédez à votre compte
          </Button>
        </Section>

        <Text style={text}>
          Si vous avez des questions, notre équipe reste disponible à tout moment :
        </Text>

        <Section style={contactSection}>
          <Text style={contactText}>
            📧 <Link href="mailto:djassa@djassa.tech" style={link}>djassa@djassa.tech</Link><br />
            📱 WhatsApp : <Link href="https://wa.me/2250788281222" style={link}>+225 07 88 28 12 22</Link>
          </Text>
        </Section>

        <Text style={signature}>
          Merci de faire partie de l'aventure Djassa 💛<br /><br />
          — L'équipe Djassa
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

const benefitsList = {
  padding: '10px 20px',
}

const benefitItem = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
}

const buttonContainer = {
  padding: '20px 20px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#F7941D',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const smallText = {
  color: '#666',
  fontSize: '13px',
  lineHeight: '20px',
  padding: '0 20px',
  margin: '10px 0',
}

const urlText = {
  color: '#F7941D',
  fontSize: '12px',
  lineHeight: '18px',
  padding: '0 20px',
  margin: '5px 0',
  wordBreak: 'break-all' as const,
}

const contactSection = {
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  margin: '20px',
}

const contactText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '26px',
  margin: '0',
  textAlign: 'center' as const,
}

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '20px 20px 10px',
  textAlign: 'center' as const,
  borderTop: '1px solid #eee',
  marginTop: '30px',
}

const link = {
  color: '#F7941D',
  textDecoration: 'none',
}

const signature = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  padding: '0 20px',
  textAlign: 'center' as const,
  fontStyle: 'italic',
  marginTop: '20px',
}
