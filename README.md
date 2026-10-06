# Ansh Dobariya — Robotics Engineer Portfolio

A reference-matched white / black / graphite portfolio with subtle industrial orange accents.

## Interaction model

- Pointer controls the hero robot's orientation/end-effector target.
- Pick/Place state is wired into the hero scene.
- Scroll reveals are powered by GSAP.
- The layout is intentionally close to the supplied portfolio reference: typography, spacing, section order, project cards, skills grid, journey split, and contact composition.

## 3D model

The prototype points at this GLB source:
https://raw.githubusercontent.com/microsoft/experimental-pcf-control-assets/master/robot_arm.glb

Microsoft documentation publicly references this asset as a "Robot Arm" GLB. For production use, replace `MODEL_URL` in `src/main.tsx` with a GLB you have a clear commercial/portfolio license for.

Premium candidates to evaluate:
- CGTrader 6-Axis Industrial Robotic Arm: https://www.cgtrader.com/3d-models/industrial/industrial-machine/6-axis-industrial-robotic-arm
- CGTrader Industrial Robotic Arm Basic Version: https://www.cgtrader.com/3d-models/industrial/industrial-machine/industrial-robot-arm-basic-version
- Sketchfab 6 Axis Industrial Robot Arm (CC BY): https://sketchfab.com/3d-models/6-axis-industrial-robot-arm-3ecc74c22c584b2b8295f17dedcdb89f

Before using a paid or CC-BY asset in a public portfolio, verify the current license terms and attribution requirements on the listing page.

## Run

```bash
npm install
npm run dev
```

## Wix

The cleanest production path is to deploy the built Vite app and embed the hero/custom element in Wix, or port the 3D scene into a Wix Custom Element. Keep the UI sections as HTML/CSS and isolate Three.js inside the hero to preserve performance.
