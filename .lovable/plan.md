
# Correction : Carte vide + Session non persistante

## Problemes identifies

### 1. Carte vide (aucun spot affiche)
La requete `supabase.from("places").select("*")` dans MapView echoue silencieusement -- l'erreur est ignoree (`if (!error && data)`). Meme si les 30 spots existent en base et les politiques RLS sont maintenant PERMISSIVE, le composant n'affiche aucun retour en cas d'echec. Le probleme vient probablement d'un timing : le composant MapView se monte avant que la session auth ne soit prete, et la requete echoue avec un token invalide ou absent.

**Correction** : Ajouter un log d'erreur explicite dans le fetch, et aussi retenter le fetch quand l'utilisateur change (pour s'assurer que la session est active).

### 2. L'app ne se souvient pas de l'utilisateur
L'authentification Google via `lovable.auth.signInWithOAuth` fonctionne et la session est stockee dans `localStorage`. Cependant, le `signOut` fait un `window.location.reload()` brutal. Le vrai probleme est que le composant `Index` affiche la LandingPage par defaut a chaque nouvelle session navigateur (`sessionStorage.getItem("wk_landed")` utilise `sessionStorage` qui est videe a la fermeture du navigateur). Cela donne l'impression que l'app "oublie" l'utilisateur, alors que c'est juste l'ecran de landing qui reapparait.

**Correction** : Utiliser `localStorage` au lieu de `sessionStorage` pour `wk_landed`, et ne pas afficher la landing si l'utilisateur est deja connecte.

---

## Plan technique

### Etape 1 : Corriger la persistence de la landing page
Dans `src/pages/Index.tsx` :
- Remplacer `sessionStorage` par `localStorage` pour `wk_landed`
- Si l'utilisateur est deja connecte (`user` existe), passer la landing automatiquement

### Etape 2 : Corriger le chargement de la carte
Dans `src/components/MapView.tsx` :
- Ajouter `console.error` quand le fetch des places echoue
- Ajouter `user` comme dependance ou utiliser un re-fetch pour s'assurer que les places sont chargees quand la session est prete

### Etape 3 : Recreer le trigger `handle_new_user` (securite)
Le trigger existe deja (`on_auth_user_created`), pas besoin de le recreer.

Ces corrections devraient resoudre les deux problemes en 2-3 minutes.
