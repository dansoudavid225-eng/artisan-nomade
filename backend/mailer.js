/**
 * mailer.js – Service d'envoi d'email via Nodemailer
 * Compatible Gmail avec "mot de passe d'application"
 */

const nodemailer = require('nodemailer');

// Créer le transporteur (lazy init pour éviter crash si pas configuré)
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Envoyer une notification de nouvelle commande à l'admin
 */
async function sendOrderNotification(order) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Mailer] Email non configuré – notification ignorée');
    return;
  }

  const transporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const produitsList = order.produits
    .map(p => `• ${p.nom} (Qté: ${p.quantite || 1})`)
    .join('\n');

  await transporter.sendMail({
    from: `"Artisan Nomade" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `🛍️ Nouvelle commande #${order.reference} – ${order.client.nom}`,
    text: `
Nouvelle commande reçue !

━━━━━━━━━━━━━━━━━━━━━━━━
Référence : ${order.reference}
Date       : ${new Date(order.createdAt).toLocaleString('fr-FR')}
━━━━━━━━━━━━━━━━━━━━━━━━

CLIENT
Nom     : ${order.client.nom}
Email   : ${order.client.email}
Tél     : ${order.client.telephone || 'Non renseigné'}
Ville   : ${order.client.ville}
Pays    : ${order.client.pays}

PRODUITS
${produitsList}

MESSAGE
${order.message || 'Aucun message'}

━━━━━━━━━━━━━━━━━━━━━━━━
Répondre via WhatsApp :
https://wa.me/${process.env.WHATSAPP_NUMBER}
    `.trim(),
  });
}

/**
 * Envoyer confirmation de commande au client
 */
async function sendOrderConfirmation(order) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  if (!order.client.email) return;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Artisan Nomade" <${process.env.EMAIL_USER}>`,
    to: order.client.email,
    subject: `✅ Commande confirmée #${order.reference} – Artisan Nomade`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Georgia,serif;background:#F5EDD8;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <div style="background:#2C1A0E;padding:32px;text-align:center;">
      <h1 style="color:#C9A84C;font-size:1.6rem;margin:0;letter-spacing:3px;">ARTISAN NOMADE</h1>
      <p style="color:#F5EDD8;font-size:0.85rem;margin:8px 0 0;letter-spacing:2px;">Porto-Novo · Bénin</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#2C1A0E;font-size:1rem;margin-bottom:8px;">Bonjour <strong>${order.client.nom}</strong>,</p>
      <p style="color:#4A2E18;margin-bottom:24px;">Nous avons bien reçu votre commande. Notre artisane va l'étudier et vous contactera très prochainement via WhatsApp ou email.</p>
      
      <div style="background:#F5EDD8;border-radius:6px;padding:20px;margin-bottom:24px;">
        <p style="font-size:0.75rem;color:#8A7A6A;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Référence de commande</p>
        <p style="font-size:1.4rem;color:#C9A84C;font-weight:bold;margin:0;">${order.reference}</p>
        <p style="font-size:0.8rem;color:#8A7A6A;margin:4px 0 0;">Gardez cette référence pour le suivi</p>
      </div>

      <p style="color:#4A2E18;font-size:0.9rem;margin-bottom:16px;">Pour toute question, contactez-nous :</p>
      <a href="https://wa.me/${process.env.WHATSAPP_NUMBER}" 
         style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:0.9rem;">
        💬 WhatsApp
      </a>
    </div>
    <div style="background:#F5EDD8;padding:16px;text-align:center;">
      <p style="font-size:0.75rem;color:#8A7A6A;margin:0;">© ${new Date().getFullYear()} Artisan Nomade · artisannomade.com</p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

/**
 * Envoyer confirmation d'inscription newsletter
 */
async function sendNewsletterWelcome(email) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Artisan Nomade" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🪩 Bienvenue dans notre liste VIP – Artisan Nomade`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family:Georgia,serif;background:#F5EDD8;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#2C1A0E;border-radius:8px;padding:40px;text-align:center;">
    <h1 style="color:#C9A84C;font-size:1.8rem;letter-spacing:3px;margin-bottom:8px;">ARTISAN NOMADE</h1>
    <p style="color:#F5EDD8;margin-bottom:24px;">Merci de rejoindre notre communauté !</p>
    <p style="color:#E2C47A;font-size:0.95rem;line-height:1.7;">
      Vous recevrez en avant-première nos nouvelles collections, <br>
      offres exclusives et coulisses de l'atelier.
    </p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(201,168,76,0.3);">
      <p style="color:#8A7A6A;font-size:0.75rem;">Porto-Novo · Bénin · artisannomade.com</p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

module.exports = { sendOrderNotification, sendOrderConfirmation, sendNewsletterWelcome };
