# Mochi Stack

Un jeu web open source d'[OpenGamingStudio](https://opengamingstudio.com) : un mochi glisse au-dessus de la tour, un tap le lâche. Ce qui dépasse est coupé, la tour rétrécit. Un tap pile = combo (la largeur se regagne). La partie finit quand il ne reste plus rien ; le score est la hauteur, le meilleur score est gardé dans le navigateur.

Jeu : https://mochi-stack.opengamingstudio.com

## Développer

```
npm ci
npm run dev        # serveur local
npm test           # tests (vitest)
npm run build      # tsc + build statique dans dist/
```

Vite + TypeScript + Tailwind, canvas 2D, sons synthétisés (Web Audio, coupables), police Fredoka auto-hébergée (OFL). Déploiement : Dockerfile nginx à la racine.

## Licence

MIT.
