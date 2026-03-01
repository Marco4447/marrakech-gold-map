import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-gold transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold" />
          <h1 className="font-display text-lg font-bold text-foreground">Politique de Confidentialité</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-xs text-muted-foreground">Dernière mise à jour : 1er mars 2026</p>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">1. Responsable du traitement</h2>
          <p>Weshkech est un city guide digital dédié à Marrakech, proposant également des estimations de prix de taxi via son partenaire Jemaride. Le responsable du traitement des données est l'éditeur de l'application Weshkech.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">2. Données collectées</h2>
          <p>Nous collectons les données suivantes lors de votre connexion via Google :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nom complet</li>
            <li>Adresse e-mail</li>
            <li>Photo de profil Google</li>
          </ul>
          <p>Nous collectons également un identifiant d'appareil anonyme (device ID) stocké localement pour gérer vos favoris et interactions.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">3. Finalité du traitement</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Création et gestion de votre compte utilisateur</li>
            <li>Personnalisation de votre expérience (Pass Invité, favoris)</li>
            <li>Redirection vers le service d'estimation de taxi Jemaride</li>
            <li>Amélioration du service et statistiques anonymes</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">4. Base légale</h2>
          <p>Le traitement repose sur votre consentement (Art. 6.1.a du RGPD) donné lors de la connexion, ainsi que sur l'exécution du service (Art. 6.1.b).</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">5. Partage des données</h2>
          <p>Vos données ne sont jamais vendues. Elles peuvent être partagées avec :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google (authentification OAuth)</li>
            <li>Notre hébergeur cloud (stockage sécurisé)</li>
          </ul>
          <p>Lorsque vous cliquez sur le bouton « Y aller au prix juste », vous êtes redirigé vers Jemaride dans un nouvel onglet. Seul le nom du lieu est transmis en paramètre d'URL, aucune donnée personnelle.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">6. Durée de conservation</h2>
          <p>Vos données sont conservées tant que votre compte est actif. Elles sont supprimées immédiatement sur demande via le bouton « Supprimer mes données » dans votre profil.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">7. Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Droit d'accès</strong> : consulter vos données dans l'onglet Profil</li>
            <li><strong className="text-foreground">Droit de rectification</strong> : modifier vos informations via votre compte Google</li>
            <li><strong className="text-foreground">Droit à l'effacement</strong> : supprimer votre compte et toutes vos données via le bouton dédié</li>
            <li><strong className="text-foreground">Droit à la portabilité</strong> : demander l'export de vos données</li>
            <li><strong className="text-foreground">Droit d'opposition</strong> : vous désinscrire à tout moment</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">8. Cookies</h2>
          <p>Weshkech utilise uniquement des cookies techniques nécessaires au fonctionnement (session d'authentification, préférences locales). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground">9. Contact</h2>
          <p>Pour toute question relative à vos données personnelles, contactez-nous à : <span className="text-gold">contact@weshkech.com</span></p>
        </section>

        <div className="pt-4 border-t border-border">
          <Link to="/" className="text-gold text-sm hover:underline">← Retour à l'application</Link>
        </div>
      </div>
    </div>
  );
}
