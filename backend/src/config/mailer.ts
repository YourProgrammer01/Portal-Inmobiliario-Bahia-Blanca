import { createTransport } from 'nodemailer'
import { config } from '../config/env'

const transporter = createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
})

const baseTemplate = (content: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1a56db; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">PIB - Portal Inmobiliario Bahiense</h1>
    </div>
    <div style="padding: 30px; background: #f9fafb;">
      ${content}
    </div>
    <div style="padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
      © ${new Date().getFullYear()} PIB - Portal Inmobiliario Bahiense
    </div>
  </div>
`

export const sendVerificationApproved = async (email: string, name: string) => {
  await transporter.sendMail({
    from: `"PIB Portal" <${config.smtp.user}>`,
    to: email,
    subject: '✅ Tu cuenta fue verificada - PIB',
    html: baseTemplate(`
      <h2>¡Felicitaciones, ${name}!</h2>
      <p>Tu cuenta fue <strong>verificada y aprobada</strong> en el Portal Inmobiliario Bahiense.</p>
      <p>Ya podés comenzar a publicar propiedades.</p>
      <a href="${config.frontendUrl}/dashboard" 
         style="background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px;">
        Ir al Dashboard
      </a>
    `),
  })
}

export const sendVerificationRejected = async (email: string, name: string, reason: string) => {
  await transporter.sendMail({
    from: `"PIB Portal" <${config.smtp.user}>`,
    to: email,
    subject: '❌ Verificación rechazada - PIB',
    html: baseTemplate(`
      <h2>Hola, ${name}</h2>
      <p>Lamentablemente tu solicitud de verificación fue <strong>rechazada</strong>.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>Podés volver a enviar tu documentación corregida desde tu perfil.</p>
    `),
  })
}

export const sendWelcomeEmail = async (email: string, name: string) => {
  await transporter.sendMail({
    from: `"PIB Portal" <${config.smtp.user}>`,
    to: email,
    subject: '¡Bienvenido a PIB - Portal Inmobiliario Bahiense!',
    html: baseTemplate(`
      <h2>¡Bienvenido, ${name}!</h2>
      <p>Tu cuenta fue creada exitosamente en el <strong>Portal Inmobiliario Bahiense</strong>.</p>
      <p>Tu documentación está siendo revisada. Te notificaremos por email cuando sea aprobada.</p>
    `),
  })
}
