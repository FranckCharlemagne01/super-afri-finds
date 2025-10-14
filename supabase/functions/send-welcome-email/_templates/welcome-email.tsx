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
    <Preview>🎉 Bienvenue sur Djassa – Confirmez votre adresse e-mail</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bienvenue sur Djassa !</Heading>
        
        <Text style={text}>
          Bonjour <strong>{firstName}</strong>,
        </Text>

        <Text style={text}>
          Merci de vous être inscrit(e) sur <strong>Djassa</strong>, la plateforme de commerce en ligne qui connecte acheteurs et vendeurs autour de milliers de produits.
        </Text>

        <Text style={text}>
          Vous êtes désormais à un clic de :
        </Text>

        <Section style={benefitsList}>
          <Text style={benefitItem}>✅ Profiter d'offres exclusives</Text>
          <Text style={benefitItem}>🛒 Explorer des catégories comme mode, maison, beauté, électronique, et bien plus</Text>
          <Text style={benefitItem}>🏪 Créer et gérer votre propre boutique en ligne</Text>
        </Section>

        <Text style={text}>
          👉 Veuillez confirmer votre adresse e-mail pour activer votre compte :
        </Text>

        <Section style={buttonContainer}>
          <Button href={confirmationUrl} style={button}>
            🔗 Confirmer mon adresse e-mail
          </Button>
        </Section>

        <Text style={smallText}>
          Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
        </Text>
        <Text style={urlText}>{confirmationUrl}</Text>

        <Section style={securitySection}>
          <Text style={securityText}>
            🔐 <strong>Sécurité :</strong><br />
            Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message ou contactez notre support.
          </Text>
        </Section>

        <Text style={footer}>
          💼 <strong>Djassa</strong> – Achetez. Vendez. Gagnez.<br />
          📧 <Link href="mailto:contact@djassa.tech" style={link}>contact@djassa.tech</Link><br />
          🌐 <Link href="https://djassa.tech" target="_blank" style={link}>www.djassa.tech</Link>
        </Text>

        <Text style={signature}>
          Merci et bienvenue dans la communauté Djassa !<br />
          — L'équipe Djassa 💛
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

const securitySection = {
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  margin: '20px',
}

const securityText = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
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
