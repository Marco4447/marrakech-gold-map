// WeshKech email templates — shared between Edge Functions and preview

const LOGO_URL = "https://weshkech.com/logo_72.png";
const BASE_URL = "https://weshkech.com";

function layout(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1C1209;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 24px">
<tr><td style="text-align:center;padding-bottom:24px">
  <img src="${LOGO_URL}" width="48" height="48" style="border-radius:12px" alt="WeshKech" />
</td></tr>
<tr><td style="color:#F8EEE0;font-size:15px;line-height:1.6">
${content}
</td></tr>
<tr><td style="padding-top:32px;border-top:1px solid rgba(212,146,30,0.2);text-align:center">
  <p style="color:rgba(248,238,224,0.3);font-size:11px;margin:0">
    WeshKech · Marrakech · <a href="${BASE_URL}" style="color:#D4921E;text-decoration:none">weshkech.com</a>
  </p>
</td></tr>
</table></body></html>`;
}

function cta(text: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="text-align:center">
  <a href="${url}" style="display:inline-block;background:#D4921E;color:#0E0904;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none">${text}</a>
</td></tr></table>`;
}

// ═══════════════════════════════════════
// USER ONBOARDING EMAILS
// ═══════════════════════════════════════

export const userEmail1 = {
  subject: "Bienvenue sur WeshKech 🔥",
  html: layout(`
    <h1 style="color:#F8EEE0;font-size:24px;font-weight:900;margin:0 0 8px;text-align:center">Marrakech comme les locaux</h1>
    <p style="text-align:center;color:rgba(248,238,224,0.6)">500 adresses vérifiées t'attendent. Commence par explorer la médina — les meilleurs rooftops, restos et cafés sont à portée de tap.</p>
    ${cta("Découvrir les spots", BASE_URL)}
    <p style="text-align:center;color:rgba(248,238,224,0.4);font-size:12px">Gratuit · Pas de pub · Par des locaux</p>
  `),
};

export function userEmail2(spots: { name: string; category: string; description: string }[]): { subject: string; html: string } {
  const spotCards = spots.map(s => `
    <div style="background:#281508;border:1px solid rgba(212,146,30,0.2);border-radius:12px;padding:16px;margin-bottom:12px">
      <p style="color:#D4921E;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">${s.category}</p>
      <p style="color:#F8EEE0;font-size:16px;font-weight:800;margin:0 0 6px">${s.name}</p>
      <p style="color:rgba(248,238,224,0.5);font-size:13px;margin:0">${s.description}</p>
    </div>
  `).join("");

  return {
    subject: "3 spots que tu dois absolument tester",
    html: layout(`
      <h1 style="color:#F8EEE0;font-size:22px;font-weight:900;margin:0 0 16px;text-align:center">3 spots à ne pas manquer</h1>
      ${spotCards}
      ${cta("Voir sur la carte", BASE_URL)}
    `),
  };
}

export const userEmail3 = {
  subject: "Tu as un pass Insider gratuit 🎁",
  html: layout(`
    <h1 style="color:#F8EEE0;font-size:22px;font-weight:900;margin:0 0 8px;text-align:center">Ton pass Insider t'attend</h1>
    <p style="text-align:center;color:rgba(248,238,224,0.6)">Active ton pass gratuit et profite d'avantages exclusifs chez tous les partenaires WeshKech à Marrakech.</p>
    <div style="background:#281508;border:1px solid rgba(212,146,30,0.2);border-radius:12px;padding:20px;margin:16px 0">
      <p style="color:#F8EEE0;font-size:14px;margin:0 0 8px">✓ Badge Insider sur ton profil</p>
      <p style="color:#F8EEE0;font-size:14px;margin:0 0 8px">✓ QR code unique vérifié</p>
      <p style="color:#F8EEE0;font-size:14px;margin:0 0 8px">✓ Réductions chez les partenaires</p>
      <p style="color:#F8EEE0;font-size:14px;margin:0">✓ Accès prioritaire aux événements</p>
    </div>
    ${cta("Activer mon pass", `${BASE_URL}/vip-pass`)}
    <p style="text-align:center;color:rgba(248,238,224,0.4);font-size:12px">100% gratuit · Pour toujours</p>
  `),
};

// ═══════════════════════════════════════
// PARTNER EMAILS
// ═══════════════════════════════════════

export const partnerEmail1 = {
  subject: "Votre fiche WeshKech est activée ✓",
  html: layout(`
    <h1 style="color:#F8EEE0;font-size:22px;font-weight:900;margin:0 0 8px;text-align:center">Bienvenue parmi les partenaires</h1>
    <p style="text-align:center;color:rgba(248,238,224,0.6)">Votre fiche est maintenant visible par toute la communauté WeshKech. Commencez par personnaliser votre profil et publier votre première Vibe Officielle.</p>
    ${cta("Accéder à mon dashboard", `${BASE_URL}/partner-dashboard`)}
  `),
};

export const partnerEmail2 = {
  subject: "Comment optimiser votre fiche partenaire",
  html: layout(`
    <h1 style="color:#F8EEE0;font-size:22px;font-weight:900;margin:0 0 16px;text-align:center">3 conseils pour maximiser votre visibilité</h1>
    <div style="background:#281508;border:1px solid rgba(212,146,30,0.2);border-radius:12px;padding:16px;margin-bottom:12px">
      <p style="color:#D4921E;font-size:13px;font-weight:800;margin:0 0 4px">📸 Ajoutez vos meilleures photos</p>
      <p style="color:rgba(248,238,224,0.5);font-size:13px;margin:0">Les fiches avec photos reçoivent 3x plus de vues. Ambiance, plats, terrasse — montrez votre identité.</p>
    </div>
    <div style="background:#281508;border:1px solid rgba(212,146,30,0.2);border-radius:12px;padding:16px;margin-bottom:12px">
      <p style="color:#D4921E;font-size:13px;font-weight:800;margin:0 0 4px">🕐 Mettez vos horaires à jour</p>
      <p style="color:rgba(248,238,224,0.5);font-size:13px;margin:0">Les utilisateurs filtrent par "Ouvert maintenant". Des horaires précis = plus de clients.</p>
    </div>
    <div style="background:#281508;border:1px solid rgba(212,146,30,0.2);border-radius:12px;padding:16px;margin-bottom:12px">
      <p style="color:#D4921E;font-size:13px;font-weight:800;margin:0 0 4px">🎁 Créez une offre VIP</p>
      <p style="color:rgba(248,238,224,0.5);font-size:13px;margin:0">Les spots avec offre VIP reçoivent 5x plus de check-ins. Cocktail offert, -20%, accès prioritaire...</p>
    </div>
    ${cta("Modifier ma fiche", `${BASE_URL}/partner-dashboard`)}
  `),
};

export const partnerEmail3 = {
  subject: "Vos stats de la première semaine 📊",
  html: layout(`
    <h1 style="color:#F8EEE0;font-size:22px;font-weight:900;margin:0 0 8px;text-align:center">Votre première semaine sur WeshKech</h1>
    <p style="text-align:center;color:rgba(248,238,224,0.6)">Voici un aperçu de vos performances. Consultez votre dashboard pour les détails complets et téléchargez votre rapport PDF.</p>
    ${cta("Voir mes analytics", `${BASE_URL}/partner-dashboard`)}
    <p style="text-align:center;color:rgba(248,238,224,0.4);font-size:12px">Rapport détaillé disponible dans votre Partner Studio</p>
  `),
};
