/**
 * Templates de prospection B2B pour Marrakech
 * DM Instagram, Commentaires, WhatsApp
 * Stratégie: Curiosité > Vente directe
 */

export const partnerOutreachTemplates = {
  // ÉTAPE 1: Commentaires "Hook" (à publier sur leurs posts récents)
  comments: {
    curiosity: [
      "Le spot est déjà sur la carte live 👀",
      "Code secret ici ? 👀",
      "Tu es déjà là ce soir ? 🗺️",
      "Les insiders m'ont envoyé ici 👀",
    ],
    soft: [
      "L'ambiance a l'incroyable ✨",
      "C'est LE spot ce soir 👌",
      "Tu es sur la carte ce soir 🗺️",
      "Ambiance parfaite pour les insiders 👀",
    ],
    weekend: [
      "Soirée résidente ce vendredi ? 👀",
      "Qui est là ce soir 🗺️",
      "Le spot est chaud ce weekend 🔥",
    ],
  },

  // ÉTAPE 2: DM Instagram (après 48h d'engagement)
  dms: {
    // DM initial - approche découverte
    initial: `👋 Salut {nom} !

Je suis Pierre de WeshKech — j'ai remarqué que votre spot commence à buzzer sur notre carte live Marrakech.

Des utilisateurs ont déjà tagué {nom_établissement}, donc je voulais juste vous prévenir que vous apparaissez déjà (gratuitement) sur la map temps réel de la ville.

🔗 Votre fiche: https://marrakech-gold-map.lovable.app/place/{slug}

Ça pourrait être cool d'en faire un peu plus — je vous explique comment en 2 min ?`,

    // DM relance (3 jours après initial sans réponse)
    followup: `👋 {nom}, petit up !

Votre fiche a déjà eu {nombre_vues} vues cette semaine sur notre carte.

Je vous ai réservé 15 crédits de visibilité gratuits pour tester la version complète (Guest Pass, Official Vibes, etc).

Lien d'invitation unique: {lien_invite}

Ça prend 2 minutes et c'est sans engagement.`,

    // DM fermeture (dernier essai)
    closing: `👋 {nom}, dernier message — je ne voulais pas que ça passe à la trappe.

Vos concurrents directs (j'ai regardé {concurrent_1} et {concurrent_2}) sont déjà actifs sur la plateforme et captent le trafic "où sortir ce soir".

Si vous voulez juste voir à quoi ressemble votre dashboard partenaire: https://marrakech-gold-map.lovable.app/demo

Et si c'est pas pour vous, pas de souci — votre fiche reste gratuite sur la carte quand même ✌️`,
  },

  // ÉTAPE 3: WhatsApp (quand tu as leur numéro ou via QR)
  whatsapp: {
    // WhatsApp initial
    initial: `Bonjour {nom},

Je suis Pierre de *WeshKech* — l'app qui montre la vibe live des spots de Marrakech.

Votre établissement est déjà référencé sur notre carte ({lien_fiche}), et je remarque que vous avez de l'affluence ce weekend.

Je vous propose 15 crédits gratuits pour booster votre visibilité pendant les heures de choix (18h-22h).

Ça permet d'apparaître en "Trending Tonight" et d'attirer les décideurs de dernière minute.

Intéressé pour qu'on en parle 2 minutes ?`,

    // Réponse aux objections
    objection_price: `Totalement compris — c'est pourquoi je vous propose de *tester gratuitement* avant de décider.

Les 15 crédits sont offerts, pas de carte requise. Si vous voyez une montée de trafic sur votre fiche, on parlera. Sinon, vous gardez la version gratuite à vie.

C'est vraiment sans risque.`,

    objection_time: `Je comprends, vous êtes débordés. 

C'est pourquoi je vous ai préparé un lien d'invitation qui fait tout automatiquement : activation en 2 minutes, QR code généré automatiquement pour votre table.

Vous avez juste à cliquer et suivre les étapes : {lien_invite}

Si vous bloquez, je suis dispo par téléphone.`,

    objection_competitors: `C'est justement l'avantage — {concurrent_1} et {concurrent_2} sont déjà dessus et prennent les premiers clients du weekend.

En 3 semaines, ils ont capté {nombre_leads} prospects qui cherchaient "où sortir ce soir".

Je vous laisse un lien pour voir votre dashboard simulé : https://marrakech-gold-map.lovable.app/demo

Ça vous donne une idée de ce qui est possible.`,
  },

  // Réponses rapides aux questions fréquentes
  faqReplies: {
    what_is_it: `WeshKech, c'est la carte live de Marrakech — les utilisateurs partagent leur vibe en temps réel depuis les spots.

Pour vous, c'est 3 choses :
1. Fiche gratuite sur la carte
2. Guest Pass VIP pour convertir vos clients en réguliers  
3. Official Vibes pour poster vos events/soirées directement

Tout est géré depuis un dashboard simple sur téléphone.`,

    how_much: `Il y a 3 niveaux :
• Découverte : Gratuit (15 crédits offerts pour tester)
• Business : 49€/mois (visibilité boostée + analytics)
• Empire : 99€/mois (priorité sur la carte + trending)

Mais on commence toujours par la version gratuite — je vous envoie le lien d'invitation avec les 15 crédits ?`,

    how_it_works: `Ultra simple :
1. Vous cliquez sur le lien d'invitation que je vous envoie
2. Vous créez votre compte (2 min)
3. Votre fiche partenaire s'active automatiquement
4. Je vous envoie le QR code à placer sur votre table

Les clients scannent → voient votre Guest Pass → reviennent plus souvent.

Je vous envoie le lien ?`,
  },
};

// Helper pour personnaliser les templates
export function personalizeTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return result;
}

// Exemple d'utilisation:
// const dm = personalizeTemplate(partnerOutreachTemplates.dms.initial, {
//   nom: "Karim",
//   nom_établissement: "Le Comptoir",
//   slug: "le-comptoir"
// });
