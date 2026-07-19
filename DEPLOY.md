# Deploy manual

## Requisitos previos

```bash
# Tener Firebase CLI instalado
npm install -g firebase-tools

# Estar autenticado
firebase login

# Estar en el directorio del proyecto
cd ~/Developer/FonoaudiologaValentina
```

---

## Reglas de Firestore

Cuando cambiás `firestore.rules`:

```bash
cd ~/Developer/FonoaudiologaValentina
firebase deploy --only firestore:rules --project fonoaudiologa-valentina-5a014
```

---

## Sitio web (hosting)

Cuando cambiás código en `src/`:

```bash
cd ~/Developer/FonoaudiologaValentina
npm run build
firebase deploy --only hosting --project fonoaudiologa-valentina-5a014
```

---

## Todo junto (reglas + hosting)

```bash
cd ~/Developer/FonoaudiologaValentina
npm run build
firebase deploy --project fonoaudiologa-valentina-5a014
```

---

## Referencias

- Sitio: https://fonoaudiologa-valentina-5a014.web.app
- Firebase console: https://console.firebase.google.com/project/fonoaudiologa-valentina-5a014
- Firestore (database `vale`): https://console.firebase.google.com/project/fonoaudiologa-valentina-5a014/firestore/databases/vale
