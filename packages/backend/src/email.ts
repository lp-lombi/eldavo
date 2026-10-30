import nodemailer from 'nodemailer';

function getEmailConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !user || !password || !from) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass: password },
    from,
  };
}

export async function sendAppointmentConfirmationEmail(input: {
  recipient: string;
  requesterName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<boolean> {
  const configuration = getEmailConfiguration();
  if (!configuration) {
    console.warn('Appointment confirmation email was not sent: SMTP is not configured');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: configuration.auth,
  });
  await transporter.sendMail({
    from: configuration.from,
    to: input.recipient,
    subject: `Turno confirmado: ${input.title}`,
    text: `Hola ${input.requesterName},\n\nTu turno fue confirmado.\n\nFecha: ${input.startsAt.toLocaleString('es-AR')}\nHasta: ${input.endsAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n\nGracias.`,
  });
  return true;
}
