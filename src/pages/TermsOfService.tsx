import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-gold transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gold" />
          <h1 className="font-display text-lg font-bold text-foreground">Conditions Générales</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-xs text-muted-foreground">Dernière mise à jour : 1er mars 2026</p>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">1. Objet</h2>
          <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application Weshkech, un city guide digital dédié à la ville de Marrakech, proposant un plan interactif, un flux communautaire en direct, et une redirection vers des services d'estimation de prix de taxi.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">2. Accès au service</h2>
          <p>L'accès à Weshkech nécessite une connexion via un compte Google. L'utilisation de l'application est gratuite. Le « Pass Invité » est un document informatif sans valeur contractuelle garantissant un avantage commercial.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">3. Description du service</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Map</strong> : carte interactive des lieux recommandés à Marrakech</li>
            <li><strong className="text-foreground">Live</strong> : flux communautaire de photos et de recommandations</li>
            <li><strong className="text-foreground">Pass Invité</strong> : QR code informatif associé à un lieu</li>
            <li><strong className="text-foreground">Estimation taxi</strong> : redirection vers le service tiers Jemaride pour une estimation de prix de course</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">4. Service de taxi — Jemaride</h2>
          <p>Weshkech n'est pas un service de transport. Le bouton « Y aller au prix juste » redirige l'utilisateur vers le site tiers <span className="text-gold">jemaride.com</span>, qui est seul responsable de ses services, tarifs et conditions. Weshkech décline toute responsabilité quant aux prestations fournies par Jemaride.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">5. Contenu utilisateur</h2>
          <p>Les utilisateurs peuvent publier des photos et commentaires via le flux Live. En publiant du contenu, vous garantissez en détenir les droits et accordez à Weshkech une licence non exclusive pour l'afficher dans l'application. Tout contenu illicite, diffamatoire ou inapproprié pourra être supprimé sans préavis.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">6. Propriété intellectuelle</h2>
          <p>L'ensemble des éléments de l'application (design, textes, logos, code) est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">7. Limitation de responsabilité</h2>
          <p>Weshkech est fourni « en l'état ». Nous ne garantissons pas l'exactitude des informations sur les lieux (horaires, prix, disponibilité). Les estimations de prix de taxi affichées via Jemaride sont indicatives et peuvent différer du tarif final.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">8. Données personnelles</h2>
          <p>Le traitement de vos données personnelles est détaillé dans notre <Link to="/privacy" className="text-gold hover:underline">Politique de Confidentialité</Link>.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">9. Résiliation</h2>
          <p>Vous pouvez supprimer votre compte à tout moment via l'onglet Profil. Weshkech se réserve le droit de suspendre tout compte en cas de violation des présentes CGU.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">10. Droit applicable</h2>
          <p>Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">11. Contact</h2>
          <p>Pour toute question : <span className="text-gold">contact@weshkech.com</span></p>
        </section>

        <div className="pt-4 border-t border-border">
          <Link to="/" className="text-gold text-sm hover:underline">← Retour à l'application</Link>
        </div>
      </div>
    </div>
  );
}
