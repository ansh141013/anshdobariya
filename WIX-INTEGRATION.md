# Wix integration

## Recommended setup

Deploy the Vite app to a host with HTTPS, then use Wix Studio's Custom Element/HTML Embed path for the 3D hero.

Keep the rest of the page as Wix/HTML sections if you want native Wix editing. The 3D experience should stay isolated in the hero component.

## Hero contract

The hero component should expose:

- `modelUrl`
- `theme`
- `interactionEnabled`
- `picked`
- `scrollProgress`

Pointer coordinates should drive a normalized target in `[-1, 1]` and the robot layer should convert that target to joint motion.

## Production model

Replace `MODEL_URL` in `src/main.tsx` with your licensed GLB. Prefer a model with a clearly separated articulated hierarchy and named joints. A model that is only one mesh cannot provide reliable six-axis independent motion.
