import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Create Express app
const app = express();
const PORT = 3000;

// Increase JSON payload size limits for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Allow iframe embedding across domains and origins
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *;");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Initialize the recommended server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON API Endpoint to analyze uploaded position plans / hand-drawn diagrams for RGIE and French NF C 15-100 standards
app.post("/api/analyze-plan", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", standard = "RGIE" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Aucune image ou document fourni." });
    }

    // Clean base64 header if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: `Analyse cette image de plan d'implantation, d'emplacement de boîtiers, ou de schéma de câblage d'électricité résidentielle.
Identifie d'une part tous les symboles d'appareillages (les prises, interrupteurs, raccordements, points lumineux, boîtes d'appareils, etc.) ou d'éléments de câblage connectés.
Sépare-les et propose une répartition logique et optimisée en circuits divisionnaires repérés par des lettres (ex: Circuit A, Circuit B, Circuit C, Circuit D...) ou numérotés en appliquant scrupuleusement la norme demandée: ${standard}.

CONTRANTES ULTRA-STRICTES À RESPECTER IMPÉRATIVEMENT :
1. LE NOMBRE DE PRISES PAR CIRCUIT NE DOIT JAMAIS DEPASSER 8 POINTS. Si une zone ou un ensemble de pièces (ex: Chambres 1, 2 et 3) dépasse 8 points au total, divise-les obligatoirement en plusieurs circuits différents (ex: Circuit D pour Chambres 1 & 2 avec 6 points, et Circuit E pour Chambre 3 & Hall avec 5 points).
2. RACCORDEMENT ET PONTAGE PAR PROXIMITÉ : Regroupe ensemble pour un même circuit les prises et appareils les plus proches géographiquement d'une même pièce ou de pièces adjacentes (ex: Chambres 1 et 2 côte à côte) pour optimiser et raccorder au plus court.
3. FORMAT DE DESCRIPTION ET DÉROULEMENT DU CÂBLAGE : Pour chaque circuit, décris de manière ultra-détaillée l'enchaînement exact des boîtiers d'appareillages du circuit dans l'ordre de passage des câbles (les plus proches entre eux), en adoptant impérativement ce format précis :
   "Circuit [Lettre] : [lettre]1 [type de prise/boîtier] ([emplacement/zone]), [lettre]2 [type de prise/boîtier] ([emplacement/zone])... (Total : X points, conforme)"
   Exemple : "Circuit C : c1 double prises (Chambre 1), c2 triple prises (Chambre 1), c3 simple prise (Chambre 2) (Total : 6 points, conforme !)"
4. IDENTIFICATION DES VA-ET-VIENT (Double commande) : Pour chaque symbole d'interrupteur va-et-vient détecté, précise impérativement avec quelles sources lumineuses il est relié. Indique très clairement le NOMBRE et le TYPE exact de luminaires contrôlés (par exemple : le va-et-vient commande 2 lampes incandescentes, ou commande 3 néons fluorescents). Explique aussi le principe du câblage physique (liaison par deux fils navettes de 1,5 mm² entre les deux interrupteurs va-et-vient).

RÈGLES ET CONTRAINTES DE SÉCURITÉ CONSTITUTIVES (Norme ${standard}) :
- Les prises de courant normales nécessitent un disjoncteur MAX 20A et des câbles de section minimale de 2,5 mm².
- Max 8 points d'utilisation par circuit de prises normales (un boîtier double ou triple compte comme 1 point d'utilisation au RGIE belge s'il est câblé sous une même plaque, ou l'indiquer explicitement dans le rapport de points).
- Les points d'éclairage nécessitent un disjoncteur MAX 16A (ou 10A) et des câbles de section minimale de 1,5 mm².
- Les appareils gros consommateurs (Taque de cuisson, Four, Lave-linge, Lave-vaisselle, Sèche-linge, Recharge VE...) doivent impérativement être alimentés par des circuits individuels dédiés sans aucun autre récepteur.
- Taque de Cuisson: Câble de section minimale 6 mm² ou 4G4/5G6, disjoncteur de calibre adéquat de 32A pour raccordement monophasé, ou 40A en triphasé.
- Borne recharge VE: Doit figurer sur son propre disjoncteur et différentiel adapté de type A ou de type spécialisé (ou l'indiquer).
- Spécificités Belges (RGIE) :
  - L'installation complète doit être protégée en tête par un interrupteur différentiel général de Max 300 mA (Type A obligatoire en Belgique).
  - Les circuits humides (salle d'eau, machine à laver, lave-vaisselle, sèche-linge) doivent impérativement être derrière un interrupteur différentiel de haute sensibilité de 30 mA (Type A).
  - Section cuivre minimale pour le raccordement de la prise de terre : 16 mm². Résistance de terre idéale inférieure à 30 Ω pour une conformité optimale (obligatoire < 100 Ω).

Génère une réponse structurée au format JSON contenant :
1. Une liste propre de circuits divisionnaires (sans aucun doublon, max 10 ou 12 circuits logiques pour peupler le tableau récapitulatif).
2. Un texte d'analyse générale (auditSummary) résumant les forces et faiblesses observées sur le document.
3. Une liste de messages d'alertes de conformité (complianceAlerts) si des anomalies potentielles sont détectées (ex: plus de 8 prises sur une ligne, disjoncteur inapproprié, manque de différentiel 30mA).
4. Des recommandations de câblage d'expert (rgieTips).
5. Des instructions de raccordement et pontage (wiringInstructions) : Fournis une liste d'instructions pas-à-pas rédigées exactement selon le format demandé ci-dessus pour chaque circuit (ex: "Circuit C : c1 double prises (Salon), c2 triple prises (Cuisine)..."). Chaque étape décrit un circuit entier pour voir précisément comment ponter au plus court les prises les plus proches en série sans JAMAIS dépasser les 8 points réglementaires. Si le circuit intègre des commandes va-et-vient, explique en détail à combien de luminaires (lampes ou néons fluorescents) les commutateurs sont raccordés et comment faire passer les fils navettes.

Pour chaque circuit généré, respecte exactement cette structure JSON :
  - id: unique string (ex: 'c_base_a')
  - name: nom convivial en français (ex: "💡 Éclairage RDC", "🔌 Prises Chambres 1 et 2", "🍳 Taque de cuisson dédié")
  - type: strictement l'une des valeurs suivantes: "prise" | "luminaire" | "cuisson" | "ev" | "chauffe-eau" | "chauffage"
  - rating: nombre entier représentant le calibre adéquat du disjoncteur (ex: 10, 16, 20, 32)
  - section: nombre flottant de section de cuivre minimale en mm² (ex: 1.5, 2.5, 6.0)
  - diff: strictement l'une de ces deux valeurs: "A" | "AC" (Note : Préfrer "A" en RGIE, car le type AC est strictement interdit en Belgique pour les nouvelles installations, seul le type A est toléré).`,
    };

    // Construct response Schema for reliable structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        circuits: {
          type: Type.ARRAY,
          description: "La liste de circuits divisionnaires déduits rationnellement du plan.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, description: "Doit être l'un de: prise, luminaire, cuisson, ev, chauffe-eau, chauffage" },
              rating: { type: Type.INTEGER },
              section: { type: Type.NUMBER },
              diff: { type: Type.STRING, description: "Recommandé: A ou AC" },
            },
            required: ["id", "name", "type", "rating", "section", "diff"],
          },
        },
        auditSummary: {
          type: Type.STRING,
          description: "Résumé détaillé pédagogique et professionnel de l'analyse du plan.",
        },
        complianceAlerts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Alertes de sécurité ou non-conformités par rapport aux normes RGIE/NF C 15-100.",
        },
        rgieTips: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Conseils pratiques et directives de câblage clairs de l'expert voltscope.",
        },
        wiringInstructions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Instructions pas-à-pas très précises sur la manière de ponter et raccorder physiquement les prises et interrupteurs proches les uns des autres en respectant la contrainte de max 8 points d'utilisation.",
        },
      },
      required: ["circuits", "auditSummary", "complianceAlerts", "rgieTips", "wiringInstructions"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2, // Low temperature for consistent factual and structural extraction
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("L'intelligence artificielle n'a pas retourné de résultat.");
    }

    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error analyzing plan via Gemini Client:", error);
    return res.status(500).json({
      error: "Erreur lors de l'analyse automatique du plan.",
      details: error.message || error,
    });
  }
});

// Set up server side or client side React serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VoltScope Server] Listening on http://localhost:${PORT}`);
  });
}

bootstrap();
