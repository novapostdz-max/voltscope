// Auto-generated Exam Questions from Microsoft Forms: Pose compteurs communicants (123 questions)
export interface ExamChoice {
  text: string;
  isCorrect: boolean;
}

export interface ExamQuestion {
  id: string;
  number: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  category: string;
  choices: ExamChoice[];
  isMultiple: boolean;
  points: number;
}

export const EXAM_TITLE = "Pose compteurs communicants et        intervention sur comptage existant";
export const EXAM_DESCRIPTION = "Modèle d'entrainement suite au NewModupad à partir du 27/04/2026";
export const TOTAL_EXAM_POINTS = 492;

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    "id": "r47e4b4f5bc1942f6be1f79214bc0d73e",
    "number": 1,
    "title": "Dans quel cas l’architecture polyphasée sera-t-elle réalisée ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/97e94539-489f-441a-99a9-c20fd3e7e372",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "À chaque fois qu’un compteur mono est remplacé.",
        "isCorrect": false
      },
      {
        "text": "En cas de nouveau ou renouvellement de raccordement sauf en collectif et pour tous les remplacements ou poses de compteur > 50 A.",
        "isCorrect": true
      },
      {
        "text": "Uniquement si le client est en triphasé 230 V ou 400 V.",
        "isCorrect": false
      },
      {
        "text": "Uniquement si la modulation de puissance est appliquée et les installations tri",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r07f69d8288a144d2908ae766f5e9e7b3",
    "number": 2,
    "title": "Comment raccorder la liaison d’un client en monophasé sur réseau 230 V  ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/164bf099-b534-4231-ba59-71ef43fde225",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Toujours entre la borne L1 et le Neutre",
        "isCorrect": false
      },
      {
        "text": "Toujours entre la borne L1 et la borne L2",
        "isCorrect": false
      },
      {
        "text": "Entre les bornes L1 et L2 ou L1 et L3 ou L2 et L3",
        "isCorrect": true
      },
      {
        "text": "Entre les bornes L1 et Neutre ou L2 et Neutre ou L3 et Neutre",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r7772cf563bde4732a25f0bce65aaf4f5",
    "number": 3,
    "title": "À quel repère se fixe un compteur tri/tétra communicant Sagemcom MDC2 sur le plastron supérieur ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/36d5a36c-abc7-44db-909f-44ae13650429",
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Au milieu",
        "isCorrect": false
      },
      {
        "text": "En face du n°12",
        "isCorrect": true
      },
      {
        "text": "En face du n°22",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r68f667dfe924400da5b2ba0eec642aa8",
    "number": 4,
    "title": "Quel est le couple de serrage des bornes du compteur communicant ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "6 Nm",
        "isCorrect": false
      },
      {
        "text": "2.50 Nm",
        "isCorrect": false
      },
      {
        "text": "12 Nm",
        "isCorrect": false
      },
      {
        "text": "2,5 Nm mais ma seule confirmation est de tirer sur les fils.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "ra61413f91aba4f3f887e50df402b266e",
    "number": 5,
    "title": "Citez 3 paramètres à configurer au compteur :",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/ede64700-479e-423f-8f08-712b35090391",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "La puissance Limit Amp.",
        "isCorrect": true
      },
      {
        "text": "La puissance du signal de communication",
        "isCorrect": false
      },
      {
        "text": "La plage de basculement bihoraire.",
        "isCorrect": true
      },
      {
        "text": "Le type de réseau.",
        "isCorrect": true
      },
      {
        "text": "Les codes OBIS.",
        "isCorrect": false
      },
      {
        "text": "La connexion M-BUS.",
        "isCorrect": false
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "r1c76b729e1ca4d5c9ba01476c938a74d",
    "number": 6,
    "title": "A partir de quel ampérage dois-je utiliser les kits fils 35 mm² ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/609a7c79-6fb7-4451-ad1b-0151ab533e2b",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "66 A",
        "isCorrect": true
      },
      {
        "text": "40 A",
        "isCorrect": false
      },
      {
        "text": "80 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rf492bcbebc1c4392924da99d9bb489d7",
    "number": 7,
    "title": "Combien de clients maximum peut-on raccorder via un bloc de raccordement ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/8094845c-cbf2-43d1-8f4f-aebab6179915",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "2",
        "isCorrect": false
      },
      {
        "text": "4",
        "isCorrect": true
      },
      {
        "text": "5",
        "isCorrect": false
      },
      {
        "text": "17",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r3f055d5744264717919f697d3df04218",
    "number": 8,
    "title": "Que signifie ce symbole sur l'écran du compteur MDC2?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/67780cc4-b789-4dcf-bd00-78c220d5e5b6",
    "category": "Codes OBIS & Écran",
    "choices": [
      {
        "text": "La pile du compteur est HS",
        "isCorrect": false
      },
      {
        "text": "Le cache du compteur a été ouvert",
        "isCorrect": false
      },
      {
        "text": "Le compteur est défectueux suite à un choc où le compartiment mécanisme a été forcé",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rb680f372a1184545ac14517c2b4a0975",
    "number": 9,
    "title": "Que signifie le code 31.4.0 sur cet écran ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/020b5a80-d6c7-46db-84df-7f96bd0362e1",
    "category": "Codes OBIS & Écran",
    "choices": [
      {
        "text": "La limite de puissance du limiteur",
        "isCorrect": false
      },
      {
        "text": "La limite ampère (contractuelle)",
        "isCorrect": true
      },
      {
        "text": "Tension instantanée",
        "isCorrect": false
      },
      {
        "text": "Le temps restant avant de le remplacer (25 ans)",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rad0fe9add40a4032bfb67ddd4c82b749",
    "number": 10,
    "title": "Je dois placer un nouveau compteur mono 40 A. Le client possède une O.A. de 40 A. Quel matériel vais-je utiliser ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Compteur mono configuré 40 A et disjoncteur mono 40 A",
        "isCorrect": false
      },
      {
        "text": "Compteur tri/tétra configuré 40 A et disjoncteur tri/tétra 63 A",
        "isCorrect": false
      },
      {
        "text": "Compteur tri/tétra configuré 40 A et disjoncteur tri/tétra 40 A",
        "isCorrect": true
      },
      {
        "text": "Compteur tri/tétra configuré 63 A et disjoncteur tri/tétra 40 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r158fdd113eed488082e11a26545de574",
    "number": 11,
    "title": "Dans un ensemble comptage composé de 6 compteurs, qui place l’ensemble comptage ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/633b10d7-7fcb-4167-adeb-b0042e4d63cc",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Le client",
        "isCorrect": true
      },
      {
        "text": "Le GRD",
        "isCorrect": false
      },
      {
        "text": "Le fabricant d'ensemble",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rb319c0f9c5e449caa626181e1d3b49dc",
    "number": 12,
    "title": "Sur quel mode doit-on obligatoirement configurer la plage de basculement bihoraire ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/787c3694-ae2c-4f8e-becc-a8be36f05d3f",
    "category": "Tarif & RTCC",
    "choices": [
      {
        "text": "TUT22",
        "isCorrect": false
      },
      {
        "text": "TUT21",
        "isCorrect": false
      },
      {
        "text": "TUTWA",
        "isCorrect": true
      },
      {
        "text": "TUT5ToU",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "re93a28883814467aa9c57b579d9698f7",
    "number": 13,
    "title": "Le breaker interne du client vient de s’ouvrir suite à une surconsommation. Comment le client doit-il procéder pour réalimenter son installation ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/b81903ea-fa82-4122-b000-8340f549ebd4",
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Il doit téléphoner chez ORES pour qu’on envoie un technicien",
        "isCorrect": false
      },
      {
        "text": "Il doit téléphoner chez ORES pour qu’on referme le breaker à distance",
        "isCorrect": false
      },
      {
        "text": "Le client doit attendre entre 2 et 5 min pour récupérer l’autorisation à la fermeture et ensuite il peut refermer le breaker avec un appui long sur le bouton vert",
        "isCorrect": true
      },
      {
        "text": "Le client peut refermer le breaker avec un appui long sur le bouton vert",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rd5c119ec207b42a8b3cc9b781269962e",
    "number": 14,
    "title": "Quel est le dispositif de protection des surintensités du GRD ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Le breaker",
        "isCorrect": false
      },
      {
        "text": "Le disjoncteur",
        "isCorrect": true
      },
      {
        "text": "Le sectionneur",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r99928534605d48e89ae4cb98d93bfab6",
    "number": 15,
    "title": "La clé dynamométrique sert à :",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/1fb8b31e-e35a-4582-9bb4-7825b8835c67",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Rien, tous les éléments se serrent au tournevis.",
        "isCorrect": false
      },
      {
        "text": "Appliquer le bon couple de serrage aux bornes du compteur",
        "isCorrect": false
      },
      {
        "text": "Appliquer le bon couple de serrage aux bornes du sectionneur",
        "isCorrect": true
      },
      {
        "text": "Appliquer le bon couple de serrage aux bornes du disjoncteur",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r8984a46098c64acea5f5c05dbd47480a",
    "number": 16,
    "title": "De quelle longueur doit être dénudé le câble de sortie client?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/980a5059-858c-48e1-a373-7bfab37894a7",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "23 mm",
        "isCorrect": true
      },
      {
        "text": "10 mm",
        "isCorrect": false
      },
      {
        "text": "De 10 mm à 23 mm",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r83b627afd7e544fe99bcd9ef9938ad0c",
    "number": 17,
    "title": "Dans le cadre d’un nouveau raccordement pour un seul compteur en monophasé, dois-je mesurer le champ tournant ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/7e6f9557-c71b-4f02-aebb-6920e22d74bc",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Oui en sortie compteur.",
        "isCorrect": true
      },
      {
        "text": "Oui en entrée compteur.",
        "isCorrect": false
      },
      {
        "text": "Non nous sommes en mono il n’y a pas d’utilité.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r7ea28657ee704897985c89c799b871ff",
    "number": 18,
    "title": "En nouveau raccordement, je dois connaître la valeur du disjoncteur différentiel. Comment le savoir ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Je suis habilité, je peux ouvrir son coffret divisionnaire, tester son différentiel et prendre sa valeur.",
        "isCorrect": false
      },
      {
        "text": "Je suis habilité, je regarde sur mon outil de mobilité, les annexes ou je demande au client son document.",
        "isCorrect": true
      },
      {
        "text": "Je suis habilité, je peux ouvrir le coffret et lire la valeur du disjoncteur.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r39191419570a47bc8c752d2bdb036a91",
    "number": 19,
    "title": "Le client a un contrat fournisseur mais pas la réception d’organisme agrée (O.A.). Que fait-on ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "J’alimente le client, il nous fournira la réception plus tard.",
        "isCorrect": false
      },
      {
        "text": "Sectionneur ouvert, breaker fermé jusqu’au moment où le client aura son O.A et on reviendra..",
        "isCorrect": true
      },
      {
        "text": "Sectionneur fermé, breaker ouvert, bien dire au client qu’il laisse son disjoncteur fermé, comme ça on pourra l’alimenter à distance  dès qu’il sera en ordre.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "ra9eada82c7734c2186d4113d1bb57a06",
    "number": 20,
    "title": "En nouveau raccordement, utilise-t-on une RTCC ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/ec2bffc8-e508-48d5-9002-7c56b391ead9",
    "category": "Tarif & RTCC",
    "choices": [
      {
        "text": "Non",
        "isCorrect": false
      },
      {
        "text": "Oui, uniquement pour gérer le bihoraire",
        "isCorrect": false
      },
      {
        "text": "Oui, uniquement pour gérer un contact libre de potentiel",
        "isCorrect": false
      },
      {
        "text": "Oui, uniquement pour gérer le compteur exclusif nuit",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r5699846994514ef899c10a08846d3c7a",
    "number": 21,
    "title": "A quelle hauteur doit-on placer le bas d’un module 25D60 ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "1.80 M",
        "isCorrect": false
      },
      {
        "text": "+/- 1.20 M",
        "isCorrect": true
      },
      {
        "text": "0.80 M",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r45c82d7848154a4ba88de199fcfb7692",
    "number": 22,
    "title": "Sur l’écran du compteur Tri/Tétra, les flèches sur L1, L2, L3 sont fixes. Cela signifie que ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/2ff4471c-abe2-4d75-8228-1ddbf7c39732",
    "category": "Codes OBIS & Écran",
    "choices": [
      {
        "text": "Je n’ai pas de présence tension en sortie compteur.",
        "isCorrect": false
      },
      {
        "text": "Le champ tournant est antihorlogique.",
        "isCorrect": false
      },
      {
        "text": "Le champ tournant est horlogique.",
        "isCorrect": true
      },
      {
        "text": "Je suis en train d’injecter de l’énergie sur le réseau",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rf50857caf0ae4d6089ca6f4db8ab1866",
    "number": 23,
    "title": "Dans le cadre d’un nouveau raccordement, tous les fils sont-ils raccordés du réseau au sectionneur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Non, par sécurité je ne raccorde pas tous les fils au raccordement, on reviendra en cas de demande.",
        "isCorrect": false
      },
      {
        "text": "Oui, toujours et je dois même le mesurer et encoder le nombre de fils raccordés au réseau.",
        "isCorrect": true
      },
      {
        "text": "En fonction de ce qui est raccordé, je raccorderai mon sectionneur.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r3ebcdc1632a049568f157f14b738a663",
    "number": 24,
    "title": "La pose du sectionneur est-il obligatoire lors d’un nouveau raccordement en 25D60 ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Non, c’est le disjoncteur qui est obligatoire",
        "isCorrect": false
      },
      {
        "text": "Oui dans tous les cas.",
        "isCorrect": true
      },
      {
        "text": "Uniquement en architecture polyphasée",
        "isCorrect": false
      },
      {
        "text": "Uniquement en modulation de puissance",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r5686170cee1a4ce38aaae52ba9366b15",
    "number": 25,
    "title": "Quelle est l’intensité MAX d’un compteur mono en compteur communicant  ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "50 A",
        "isCorrect": false
      },
      {
        "text": "80 A",
        "isCorrect": false
      },
      {
        "text": "63 A",
        "isCorrect": false
      },
      {
        "text": "100 A",
        "isCorrect": false
      },
      {
        "text": "60 A",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r7956ef1e00e543e2830e58c635aed68c",
    "number": 26,
    "title": "Dans le cadre d’un nouveau raccordement dans un immeuble collectif à quelle valeur doit être réglée le breaker interne ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/47963e3d-295b-4de4-9314-c66096bac51c",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Toujours inférieure à la valeur du disjoncteur de protection.",
        "isCorrect": false
      },
      {
        "text": "Toujours supérieure ou égale au disjoncteur de protection.",
        "isCorrect": false
      },
      {
        "text": "Toujours égale à la valeur contractuelle du disjoncteur de protection.",
        "isCorrect": true
      },
      {
        "text": "Toujours réglée sur Max.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r83c20a58d76943a888ff23217911e0fd",
    "number": 27,
    "title": "Comment raccorder la liaison d’un client en monophasé sur réseau 400 V  ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/637d534b-b00d-43d7-accb-51475bde70a9",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Toujours entre la borne L1 et le Neutre",
        "isCorrect": false
      },
      {
        "text": "Toujours entre la borne L1 et la borne L2",
        "isCorrect": false
      },
      {
        "text": "Entre les bornes L1 et L2 ou L1 et L3 ou L2 et L3",
        "isCorrect": false
      },
      {
        "text": "Entre les bornes L1 et Neutre ou L2 et Neutre ou L3 et Neutre",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r145a8fbdc4d24ac69d0f25feadb1a648",
    "number": 28,
    "title": "À quel repère se fixe un compteur mono communicant Sagemcom MDC2 sur le plastron supérieur ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/844a2200-4f5d-4e82-8b07-f4e73a054a71",
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Au milieu",
        "isCorrect": false
      },
      {
        "text": "En face du n° 12",
        "isCorrect": false
      },
      {
        "text": "En face du n° 22",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r602a9335123e413eb82aafffa207457b",
    "number": 29,
    "title": "Quel est le couple de serrage des bornes du sectionneur  ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "8 Nm",
        "isCorrect": true
      },
      {
        "text": "2,50 Nm",
        "isCorrect": false
      },
      {
        "text": "12 Nm",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r81a4687b74834997998cf05397929e23",
    "number": 30,
    "title": "Quels champs sont à encoder dans l’outil de mobilité ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Codes OBIS & Écran",
    "choices": [
      {
        "text": "Le champ tournant",
        "isCorrect": true
      },
      {
        "text": "Les index",
        "isCorrect": true
      },
      {
        "text": "La longueur du raccordement",
        "isCorrect": true
      },
      {
        "text": "Valeur du breaker",
        "isCorrect": true
      },
      {
        "text": "Le type de coffret",
        "isCorrect": true
      },
      {
        "text": "La valeur de la protection",
        "isCorrect": true
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "r190cc5731aac4933bf41e1d2395fb1fd",
    "number": 31,
    "title": "Quelle est la section minimale des kits fils pour le raccordement d’un compteur communicant ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/2ac6cc68-c9a8-4f9d-a79c-5826a42f5d22",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "16 mm²",
        "isCorrect": false
      },
      {
        "text": "25 mm²",
        "isCorrect": true
      },
      {
        "text": "35 mm²",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r7a2f23be86de42be8774047f1b6f2873",
    "number": 32,
    "title": "Combien de clients au minimum peut-on raccorder via un bloc de raccordement ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/a11c61be-447c-4163-9aa2-cf6fad5d3ed2",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "2",
        "isCorrect": true
      },
      {
        "text": "4",
        "isCorrect": false
      },
      {
        "text": "5",
        "isCorrect": false
      },
      {
        "text": "17",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r2e2fa6e91fd84ac7999ee941afe808c2",
    "number": 33,
    "title": "En nouveau raccordement, la valeur du disjoncteur de protection à installer est déterminée par :",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/8bbf9ab4-6681-4e4e-8017-c95d6ccc4832",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "La section  des câbles qui seront installés",
        "isCorrect": false
      },
      {
        "text": "La valeur reprise sur le rapport de l’organisme agréé sauf lorsqu’il y a plusieurs compteurs sur le même raccordement",
        "isCorrect": true
      },
      {
        "text": "Le forfait choisi par le client sauf lorsqu’il y a plusieurs compteurs sur le même raccordement",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r79bd8ff329d14e6cb5e4fd70eccfac06",
    "number": 34,
    "title": "Je dois placer un nouveau compteur mono 40 A en collectif. Quel matériel vais-je utiliser ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/456b0a9c-d779-464a-82e7-43d8a036aa17",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Compteur mono configuré 40 A et disjoncteur mono 40 A",
        "isCorrect": true
      },
      {
        "text": "Compteur tri/tétra configuré 40 A et disjoncteur tri/tétra 63 A",
        "isCorrect": false
      },
      {
        "text": "Compteur tri/tétra configuré 40 A et disjoncteur tri/tétra 40 A",
        "isCorrect": false
      },
      {
        "text": "Compteur tri/tétra configuré 63 A et disjoncteur tri/tétra 40 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rcb3f3f7167484aa6a8056fc668f6dd1f",
    "number": 35,
    "title": "Un client demande un nouveau raccordement tétra 32 A. Est-ce que le compteur sera raccordé en polyphasés ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/74fb3aaf-93fd-4c66-ac5d-106db37ad51d",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Non",
        "isCorrect": false
      },
      {
        "text": "Oui",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r1b1b9eff03714653968eaf035215ce76",
    "number": 36,
    "title": "Peut-on fermer un breaker à distance ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/43efe270-3187-4b17-bc65-a89161993ee1",
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Oui, le client attend pour avoir du courant.",
        "isCorrect": false
      },
      {
        "text": "Oui mais il nous faut l’autorisation du client au préalable.",
        "isCorrect": false
      },
      {
        "text": "Non, le client reçoit une autorisation à la fermeture et il referme lui-même son breaker.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r563465ad278c4216b20fef156e6cb0de",
    "number": 37,
    "title": "Quelle est la plage horaire «heures creuses» lors du basculement bihoraire TUTWA  ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/338cc473-92a7-4cba-be70-bbef752b7471",
    "category": "Tarif & RTCC",
    "choices": [
      {
        "text": "Du lundi au dimanche de 11h-17h et 22h-7h heures  creuses",
        "isCorrect": true
      },
      {
        "text": "Du lundi au vendredi de 22h -7h heures creuses plus Week end",
        "isCorrect": false
      },
      {
        "text": "Du lundi au vendredi de 11h-17h et 22h-7h heures  creuses plus Week end",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r318020da9e2a4a82af2fe78a263e7aa7",
    "number": 38,
    "title": "Peut-on gérer la puissance contractuelle du client en utilisant le breaker sur une installation EXN ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Oui, il suffit de régler l’ampérage dans le menu technicien.",
        "isCorrect": false
      },
      {
        "text": "Non, on gère avec le disjoncteur principal.",
        "isCorrect": true
      },
      {
        "text": "Oui, on règle l’ampérage du limiteur ampère à la même valeur que le disjoncteur.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r4d6047ea8f3b4c9580985f341c149eaa",
    "number": 39,
    "title": "Sur un compteur communicant Tri/Tétra, que doit-on réaliser en cas de réseau Tri ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Utiliser un kit de raccordement avec un pontage entre entrée L2 et entrée N.",
        "isCorrect": true
      },
      {
        "text": "Rien, on utilise un kit Tétra sans utiliser le N (bleu).",
        "isCorrect": false
      },
      {
        "text": "Faire passer le réseau en Tétra et modifier le TGBT client.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "ra1210e3e7fda40a18abc2c62d88aaf0c",
    "number": 40,
    "title": "Que signifie ce symbole sur l’écran du compteur MDC2 ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/74e0c3c8-e3fb-4f2c-9940-5a2692e0f6fe",
    "category": "Codes OBIS & Écran",
    "choices": [
      {
        "text": "Je n’ai pas de présence tension en sortie compteur.",
        "isCorrect": false
      },
      {
        "text": "Le pontage L2-Neutre a été fait en réseau Tri.",
        "isCorrect": false
      },
      {
        "text": "Le mode avion est activé et donc le compteur ne communique plus.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r99fd596c13594483a60fac2b07377cea",
    "number": 41,
    "title": "En nouveau raccordement résidentiel, est-il obligatoire de mesurer le champ tournant ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/08aeadc0-d9fc-43cb-94cc-e8707b6efbf6",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Oui et je dois l’encoder",
        "isCorrect": true
      },
      {
        "text": "À la demande du client.",
        "isCorrect": false
      },
      {
        "text": "Non, on impose le champ tournant du réseau et le client adapte son TGBT au besoin.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rd780e27f2efd4dd291a1a85934b30d10",
    "number": 42,
    "title": "Dans un nouveau raccordement,  green light et O.A. sont ok.     \n Qui met en service l’installation du client ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Je suis habilité et donc une fois le raccordement terminé j’alimente l’installation du client et je lui montre qu’il est bien alimenté.",
        "isCorrect": false
      },
      {
        "text": "Je suis habilité et donc une fois terminé j’alimente le compteur du client et s’il me le demande,  j’alimente son installation aussi.",
        "isCorrect": false
      },
      {
        "text": "Je suis habilité, j’ai testé mon compteur, le sectionneur est fermé, c’est le client qui alimente son installation.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "ra2d927646daa455d8738e14cbaac6db2",
    "number": 43,
    "title": "Que doit-on sceller sur un compteur communicant placé en 25D60 ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "2 scellés en diagonale sur le 25D60 et 1 scellé sur la coiffe  et sur le bouton de configuration.",
        "isCorrect": false
      },
      {
        "text": "6 scellés sur le 25D60 et 1 scellé sur la coiffe et sur le bouton de configuration.",
        "isCorrect": false
      },
      {
        "text": "2 scellés en diagonale sur le 25D60, 6 capuchons sur le 25D60 et 1 scellé sur la coiffe et sur le bouton de configuration",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r9b23f1f7c25544ecabc036ee52192882",
    "number": 44,
    "title": "Quel est le protocole de communication longue distance ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "NB-Iot",
        "isCorrect": true
      },
      {
        "text": "M-Bus",
        "isCorrect": false
      },
      {
        "text": "P1 S1",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rc5d2e02648f34507ad859863d9299024",
    "number": 45,
    "title": "Sur un raccordement triphasé 230 V avec une liaison client mono, que se passera t’il si j’utilise les bornes  L1+N ou L3+N en sortie compteur ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/3848e21e-220f-4f83-8557-411c090e4614",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Le client aura 0 V",
        "isCorrect": false
      },
      {
        "text": "Le client aura +- 110V",
        "isCorrect": false
      },
      {
        "text": "Rien, l’installation fonctionnera correctement vu que j ai fait mon pontage L2/N",
        "isCorrect": false
      },
      {
        "text": "Le client aura 230 V mais je fais passer la charge du client par le câble de pontage en 4 mm²",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r9216232be28749ec8721d43b3f88721c",
    "number": 46,
    "title": "Dans le cadre d'un nouveau raccordement, comment le client va-t-il connaître sa puissance contractuelle et son couplage ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Avec le disjoncteur principal et le différentiel.",
        "isCorrect": false
      },
      {
        "text": "Le code 31.4.0 et le nombre de phases actives sur le compteur.",
        "isCorrect": false
      },
      {
        "text": "Avec le code 31.4.0 et le sticker apposé sur son compteur ou sur My-ORES.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rc706123777694d9d950e718bd755fc12",
    "number": 47,
    "title": "Dans le cadre d’un nouveau raccordement la valeur de réglage de l’organe de coupure interne doit toujours être :",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Inférieure ou égale à la valeur du disjoncteur de protection",
        "isCorrect": true
      },
      {
        "text": "Supérieur à la valeur du disjoncteur de protection",
        "isCorrect": false
      },
      {
        "text": "Réglée sur Max",
        "isCorrect": false
      },
      {
        "text": "Supérieure ou égale à la valeur du disjoncteur de protection",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "re183fd45fafd48c4af5017e453646ca4",
    "number": 48,
    "title": "Quel est le code couleur d’un câble de raccordement 4x10 mm² en tenant compte de l’ordre suivant : L1-L2-L3-N",
    "subtitle": null,
    "imageUrl": null,
    "category": "Codes OBIS & Écran",
    "choices": [
      {
        "text": "Bleu-brun-noir-gris",
        "isCorrect": false
      },
      {
        "text": "Brun-noir-gris-bleu",
        "isCorrect": true
      },
      {
        "text": "Noir-gris-brun-bleu",
        "isCorrect": false
      },
      {
        "text": "Peu importe du moment que le bleu est Neutre",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r364e8d0082d446a1af44cc8e3e8c6e51",
    "number": 49,
    "title": "Comment raccorde-t-on la sortie du sectionneur dans un raccordement composé d’un seul compteur ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/dd60fb6d-5fb8-469f-bf04-710c5fafae35",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "En mono « brun - bleu » en bas du sectionneur .",
        "isCorrect": false
      },
      {
        "text": "En tri « brun – noir - gris » en bas ou en haut du sectionneur.",
        "isCorrect": false
      },
      {
        "text": "Peu importe le réseau, je raccorde les 3 phases et le neutre si 400 V en bas du sectionneur.",
        "isCorrect": false
      },
      {
        "text": "Peu importe le réseau, je raccorde les 3 phases et le neutre si 400 V en haut du sectionneur.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r6ea01ee897bc4c41b8cf446e25d100fd",
    "number": 50,
    "title": "Quelle est l’intensité MAX d’un raccordement Tri/Tétra en compteur communicant  ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "50 A",
        "isCorrect": false
      },
      {
        "text": "80 A",
        "isCorrect": true
      },
      {
        "text": "63 A",
        "isCorrect": false
      },
      {
        "text": "100 A",
        "isCorrect": false
      },
      {
        "text": "60 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r9e2ede57984c4f03bb596d148d10749e",
    "number": 51,
    "title": "Que devez-vous faire avant de réaliser votre travail ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/76d286ae-0b5e-4f62-b284-5ccea8bbd497",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je réalise une analyse des risques.",
        "isCorrect": true
      },
      {
        "text": "Je préviens mon collègue que le travail peut commencer.",
        "isCorrect": false
      },
      {
        "text": "Je vérifie si j’ai le bon matériel pour une bonne réalisation du travail.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r70a97124c55144ec9d1907e69db3cbd6",
    "number": 52,
    "title": "Vous travaillez sur un comptage. Quand pouvez-vous considérer que vous êtes hors tension ? 2 réponses",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Lorsque dans le comptage la coupure est visible.",
        "isCorrect": false
      },
      {
        "text": "Lorsque les conducteurs du câble de raccordement sont déconnectés.",
        "isCorrect": false
      },
      {
        "text": "Lorsque les conducteurs du câble client sont déconnectés et isolés.",
        "isCorrect": false
      },
      {
        "text": "Lorsque toutes les parties actives sont enfermées, que la coupure est visible et que les conducteurs du câble client sont déconnectés et isolés.",
        "isCorrect": true
      },
      {
        "text": "Lorsque les conducteurs du câble de raccordement sont déconnectés et isolés et que les conducteurs du câble client sont déconnectés et isolés.",
        "isCorrect": true
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "r8a9b50050e374fe594bd33249661def4",
    "number": 53,
    "title": "Pourquoi devez-vous porter vos EPI électriques lorsque vous faites la vérification de votre travail sur un comptage ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/94ddad12-ec3a-46dc-b47f-664322aa0338",
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Parce que je me trouve dans la zone de voisinage BT.",
        "isCorrect": true
      },
      {
        "text": "Parce que je risque de pénétrer dans le gabarit de sécurité",
        "isCorrect": false
      },
      {
        "text": "Parce que je me trouve dans la zone sous tension BT.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rf762e3fa142447c09167b6a99d495883",
    "number": 54,
    "title": "Vous êtes en contact avec une installation électrique et vous ne portez pas vos EPI. Que se passe-t-il ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/880e7092-c19f-46cb-a84d-1b7b014dcae1",
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "L’entièreté du courant traverse mon corps.",
        "isCorrect": true
      },
      {
        "text": "Rien le courant ne sait pas me traverser.",
        "isCorrect": false
      },
      {
        "text": "Une partie du courant traverse mon corps.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r0f9270dfc1f6454cba560b48fc276976",
    "number": 55,
    "title": "Sur cette photo, comment éliminer le danger qu’est l’électricité (situation réelle) :",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/abc48316-4257-490f-a1c3-0bc466230f89",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je porte mes EPI.",
        "isCorrect": true
      },
      {
        "text": "Je place de la bande isolante sur l’entrée de mon sectionneur avec mes gants de manutentions",
        "isCorrect": false
      },
      {
        "text": "Je prends contact avec ORES pour qu’il vienne mettre en sécurité",
        "isCorrect": false
      },
      {
        "text": "Je mets le dossier en Impo Tech",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r836285715d7749158726f878aa542919",
    "number": 56,
    "title": "Ce type de casque à visière est-il adapté pour réaliser des tests de tension ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/8efb63de-ac3f-4c15-8029-9f45c5a47cb9",
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Oui, c’est un casque à visière.",
        "isCorrect": false
      },
      {
        "text": "Non, c’est un casque avec une visière à grille. Il me faut la visière adaptée.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r3e56653d91f14d698698d4acd947b0a3",
    "number": 57,
    "title": "Est-ce que je dois porter mes EPI pour configurer le compteur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Oui car je dois réaliser la configuration lors de différents tests. Je suis donc dans la zone de voisinage",
        "isCorrect": true
      },
      {
        "text": "Non, il n’y a pas de configuration à réaliser sur le compteur.",
        "isCorrect": false
      },
      {
        "text": "Je peux enlever mes EPI et faire la configuration quand le coffret est fermé et que le client a du courant",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rc37039a5d24845ef8f7504386116e938",
    "number": 58,
    "title": "Je suis en possession des permis AGS205 et RAT214. Est-ce que je suis habilité à poser un nouveau compteur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Non je ne suis pas habilité, je dois d’abord faire mes preuves.",
        "isCorrect": false
      },
      {
        "text": "Oui j’ai passé mes permis, je suis donc habilité et j’engage ma responsabilité en cas d’accident.",
        "isCorrect": true
      },
      {
        "text": "Non il me manque un autre permis.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rf8666b2a51c147518c37718e1ed5ea13",
    "number": 59,
    "title": "Lors de la réalisation du comptage, vous devez dénuder le câble de raccordement hors tension. Quel est le risque principal ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "La coupure.",
        "isCorrect": true
      },
      {
        "text": "La brûlure.",
        "isCorrect": false
      },
      {
        "text": "Le couteau.",
        "isCorrect": false
      },
      {
        "text": "L’électrisation.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rab007f4dd6654d0cbf0fb2d2c78a81f8",
    "number": 60,
    "title": "Quelle distance correspond à la zone de voisinage en BT ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "50 cm",
        "isCorrect": true
      },
      {
        "text": "16 cm",
        "isCorrect": false
      },
      {
        "text": "1m25",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "reb45437f1158447687aa3aa95151ed6f",
    "number": 61,
    "title": "Pourquoi devez-vous porter vos EPI électriques lorsque vous faites la vérification de votre travail sur un comptage ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/3f04d028-588c-4de1-b7a7-e29935d87522",
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Parce que je me trouve dans la zone de voisinage BT.",
        "isCorrect": true
      },
      {
        "text": "Parce que je risque de pénétrer dans le gabarit de sécurité.",
        "isCorrect": false
      },
      {
        "text": "Parce que je dois toujours porter mes EPI en BT.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "re9742020547f40aca721091a8ed40336",
    "number": 62,
    "title": "Vous touchez un tableautin métallique en contact avec une phase. Vous ne portez pas vos EPI. Que va-t-il se passer ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Rien, le courant ne sait pas traverser mon corps.",
        "isCorrect": false
      },
      {
        "text": "L’entièreté du courant traverse mon corps.",
        "isCorrect": false
      },
      {
        "text": "Une partie du courant traverse mon corps.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r1ae28c0f51a64ac68aa9223fcff5eff8",
    "number": 63,
    "title": "Vous êtes en contact avec une installation électrique, vous ne portez-pas vos EPI. Que va-t-il se passer ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/1d39e744-fef7-44f6-84d1-de363cd06a0c",
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "L’entièreté du courant traverse mon corps.",
        "isCorrect": true
      },
      {
        "text": "Rien le courant ne sait pas me traverser.",
        "isCorrect": false
      },
      {
        "text": "Une partie du courant traverse mon corps.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rd99876ea9ec545bf8993d1d90ec2812c",
    "number": 64,
    "title": "À partir de quel moment, un CDT doit-il être en possession d’une ADT ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Lorsqu’il travaille sur une installation BT restée sous tension.",
        "isCorrect": false
      },
      {
        "text": "Lorsqu’il travaille à proximité d’une installation HT mise en sécurité par les 5 RO",
        "isCorrect": true
      },
      {
        "text": "Lorsqu’il travaille sur une installation mise en sécurité par les 5 RO.",
        "isCorrect": true
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "rd158bf6af7794ef58759be044bfab0c7",
    "number": 65,
    "title": "Qui est le premier responsable de ma sécurité ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Mon chef",
        "isCorrect": false
      },
      {
        "text": "Mon collègue",
        "isCorrect": false
      },
      {
        "text": "Moi-même",
        "isCorrect": true
      },
      {
        "text": "Mon client",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rca7697b04caa40fe803a3c4ce3486375",
    "number": 66,
    "title": "Si vous estimez que votre méthode de travail se trouve dans la zone rouge: que cela signifie-t-il pour vous ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/a3d4d235-1cb9-40bc-875c-dd5910e79bb5",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Le risque encouru par mon travail est acceptable.",
        "isCorrect": false
      },
      {
        "text": "Le risque encouru par mon travail est possible.",
        "isCorrect": false
      },
      {
        "text": "Le risque encouru par mon travail est inacceptable.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rca2da624c43042879527745160d312b8",
    "number": 67,
    "title": "Quelles sont les trois conditions qui vous permettent de travailler sous tension ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Une méthode de travail existe.",
        "isCorrect": true
      },
      {
        "text": "Une installation doit être saine.",
        "isCorrect": true
      },
      {
        "text": "Je suis habilité par ORES.",
        "isCorrect": false
      },
      {
        "text": "Je respecte les consignes de mon chef.",
        "isCorrect": false
      },
      {
        "text": "Il s’agit d’une raison impérieuse (exigence impérative de service).",
        "isCorrect": true
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "r1d8c6fb0774e4c93af15347dd8d9e98d",
    "number": 68,
    "title": "Lors d’un remplacement de compteur à carte, vous êtes face à ce type d’appareillage. A quels risques êtes-vous confronté ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/149f41d4-578d-40c6-8965-41b365c8421e",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Brûlure.",
        "isCorrect": true
      },
      {
        "text": "Court-circuit.",
        "isCorrect": true
      },
      {
        "text": "Électrisation.",
        "isCorrect": true
      },
      {
        "text": "Electricité.",
        "isCorrect": false
      },
      {
        "text": "Pièces nues sous tension.",
        "isCorrect": false
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "r80921bffbe9147efa2cf352eb64dbf06",
    "number": 69,
    "title": "Vous travaillez sur un comptage. Quand pouvez-vous considérer que vous êtes hors tension ? (cochez 2 réponses)",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/2a10f9c9-1a56-4f8a-b31f-a455590f99c9",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Lorsque dans le comptage la coupure est visible.",
        "isCorrect": false
      },
      {
        "text": "Lorsque les conducteurs du câble de raccordement sont déconnectés.",
        "isCorrect": false
      },
      {
        "text": "Lorsque les conducteurs du câble client sont déconnectés et isolés.",
        "isCorrect": false
      },
      {
        "text": "Lorsque toutes les parties actives sont enfermées que la coupure est visible et que les conducteurs du câble client sont déconnectés et isolés.",
        "isCorrect": true
      },
      {
        "text": "Lorsque les conducteurs du câble de raccordement sont déconnectés et isolés et que les conducteurs du câble client sont déconnectés et isolés.",
        "isCorrect": true
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "rf48f3b64335340b5bed176979cfe1fbe",
    "number": 70,
    "title": "Dans un ensemble de comptage, un CDT peut-il travailler sur une installation sans ses  EPI électriques si il constate que l’installation n’est plus sous tension ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Oui s’il a vu le CDM réaliser les 5 RO.",
        "isCorrect": false
      },
      {
        "text": "Non, il doit être en possession d’une ADT dûment complétée.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r26fedd265bcc414e828fa3a9771e93f9",
    "number": 71,
    "title": "Dans quel cas l’architecture polyphasée sera-t-elle réalisée ​?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "À chaque fois qu’un compteur mono est remplacé.",
        "isCorrect": false
      },
      {
        "text": "En cas de nouveau ou renouvellement de raccordement sauf en collectif et pour tous les remplacements ou poses de compteurs > 50 A.",
        "isCorrect": true
      },
      {
        "text": "Uniquement si le client est en triphasé 230 V ou 400 V.",
        "isCorrect": false
      },
      {
        "text": "Uniquement si la modulation de puissance est appliquée",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r01dbad13e55b49b9a1e6d5fd685ee7a8",
    "number": 72,
    "title": "On remplace le compteur Tétra à l’initiative d’ORES, l’installation est : disjoncteur réglable 15/40 10 kA en tableautin réglé sur 25 A. Quels seront les réglages ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Valeur de réglage compteur sur MAX (999 A), disjoncteur réglé sur 40 A.",
        "isCorrect": true
      },
      {
        "text": "Valeur de réglage compteur à 25 A, disjoncteur réglé sur 25 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à 25 A, on remplace le disjoncteur par un DIN 40 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à 40 A, disjoncteur réglé sur 25 A.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r26f2e02362914b4d8f653f46268ed0bc",
    "number": 73,
    "title": "Je remplace le compteur à l’initiative d’ORES. Installation mono 40 A sur tableautin. Quel sera le type de compteur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Un compteur mono",
        "isCorrect": true
      },
      {
        "text": "Un compteur tri/tétra sortie mono",
        "isCorrect": false
      },
      {
        "text": "Un compteur tri/tétra sortie tri/tétra",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rf2e3f0c6229b46a3bf2de2dd461eac20",
    "number": 74,
    "title": "Je remplace le compteur à l’initiative d’ORES. Installation Tetra sur tableautin métallique 15 A. Quels seront les réglages ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "On remplace sous tension par un tableautin synthétique ou 25D60 avec un disj. DIN 16 A et 16 A au Breaker.",
        "isCorrect": false
      },
      {
        "text": "On remplace le compteur hors tension par un tableautin ou 25D60 avec un disj. DIN 16 A et max (999 A) au Breaker.",
        "isCorrect": true
      },
      {
        "text": "On remplace par un tableautin réduit.",
        "isCorrect": false
      },
      {
        "text": "On remplace sous tension par un tableautin synthétique avec un disj. réglé sur 40 A et 15 A au Breaker.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r644ad912c394455ca68f1304177c9ebd",
    "number": 75,
    "title": "Je remplace un compteur communicant (MDC1) par un compteur électrique MDC2. Puis-je l’appairer avec un compteur gaz MDC1 ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Oui, cela fonctionne grâce au réseau Mbus.",
        "isCorrect": false
      },
      {
        "text": "Non, il faudra remplacer le compteur gaz également par un compteur MDC2.",
        "isCorrect": true
      },
      {
        "text": "Oui, tous les compteurs sont compatibles entre eux .",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r822f6c9a01764cec815dd10909d9a1ad",
    "number": 76,
    "title": "Comment peut-on ouvrir l’organe de coupure du compteur électrique ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "À distance ou en mode configuration par le technicien ou surcharge de l’installation.",
        "isCorrect": true
      },
      {
        "text": "À distance ou manuellement par le client ou en mode configuration par le technicien.",
        "isCorrect": false
      },
      {
        "text": "Seulement à distance ou en surcharge de l’installation.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r05b17f13d9cb4bbb90d606659087cc2f",
    "number": 77,
    "title": "Quels critères sont à prendre en considération pour déterminer la valeur du disjoncteur de protection à installer lors d'un remplacement compteur à l'initiative d'ORES ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Le disjoncteur existant.",
        "isCorrect": true
      },
      {
        "text": "Le disjoncteur existant et la section du câble d’alimentation.",
        "isCorrect": false
      },
      {
        "text": "Le disjoncteur existant et la section des câbles de raccordement et sortie compteur.",
        "isCorrect": false
      },
      {
        "text": "La valeur inscrite sur le rapport d’organisme agréé demandé au client.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r56c13d02f9d94f3b99d691a6060bf457",
    "number": 78,
    "title": "Que devez-vous faire dans le cas où une partie nue sous tension est accessible ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je porte mes EPI et je l’isole avant tout acte technique.",
        "isCorrect": true
      },
      {
        "text": "Je suis reconnu BA5, je peux faire le travail à mains nues, j’ai des outils isolés 1000V.",
        "isCorrect": false
      },
      {
        "text": "Je demande que l’on coupe le courant qui alimente la cabine.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r2f707aafe54c4120b33215385feec80c",
    "number": 79,
    "title": "Est-ce que je peux récupérer ce disjoncteur mono placé chez le client ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/c09cafdc-1541-48e5-b465-257bc9ee0b26",
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Oui car il est en bon état et bon pouvoir de coupure, on reste en mono 40 A.",
        "isCorrect": true
      },
      {
        "text": "Non je place un disjoncteur mono 63 A.",
        "isCorrect": false
      },
      {
        "text": "Non, je remplace par un tétra câblé en polyphasé.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rc8b48d449bc64d59a105268a2c472b49",
    "number": 80,
    "title": "En intervenant sur le compteur d’un client, je dois déconnecter le câble réseau qui est toujours sous tension et connecté à un ancien TECO. Comment procéder ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/2fa82bff-7837-46bf-8aa4-0dcd2c523132",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Je déconnecte les câbles un par un que j’isole directement en terminant par le neutre.",
        "isCorrect": false
      },
      {
        "text": "Si je porte mes EPI pas besoin de précautions supplémentaires.",
        "isCorrect": false
      },
      {
        "text": "Je place un séparateur de phases, je maintiens le câble avec une pince isolée et je déconnecte les câbles un par un, que j’isole directement.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r0277ace9a821499787dae295280c77ee",
    "number": 81,
    "title": "Comment le client peut-il fermer l’organe de coupure interne du compteur quand il est ouvert et qu’il a l’autorisation à la fermeture ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "En appuyant 5 secondes sur le bouton vert",
        "isCorrect": true
      },
      {
        "text": "En appuyant 5 secondes sur le bouton blanc",
        "isCorrect": false
      },
      {
        "text": "En téléphonant chez ORES",
        "isCorrect": false
      },
      {
        "text": "Ce n’est pas possible",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r84ef53394c79425489d66262fec7ab9e",
    "number": 82,
    "title": "Sur un tableautin réduit, je sais placer :",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "un compteur tri/tetra et disjoncteur Teco.",
        "isCorrect": false
      },
      {
        "text": "uniquement un compteur mono et disjoncteur mono.",
        "isCorrect": true
      },
      {
        "text": "uniquement un compteur mono et disjoncteur mono et un sectionneur 125 A.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rb513f199a9d940d682eabf7fa771e608",
    "number": 83,
    "title": "Quelle est l’intensité maximale admissible pour un coffret DIN sur Tableautin en Mono ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "32 A",
        "isCorrect": false
      },
      {
        "text": "40 A",
        "isCorrect": false
      },
      {
        "text": "50 A",
        "isCorrect": true
      },
      {
        "text": "63 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r6b1c8d1faab04620b223f9169b19e56b",
    "number": 84,
    "title": "J’interviens sur un coffret 25D60 en bon état avec un compteur mono 50 A, comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Je garde le coffret, je place un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 63A",
        "isCorrect": false
      },
      {
        "text": "Je garde le coffret, je place un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 50 A",
        "isCorrect": false
      },
      {
        "text": "Je garde le coffret, je place un compteur mono que je configure à MAX (999 A) et un disjoncteur mono 50 A",
        "isCorrect": true
      },
      {
        "text": "Je garde le coffret, je place un compteur mono que je configure à 50 A et un disjoncteur mono 63 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r21879f6d4d05411e9af8f3a4523956bc",
    "number": 85,
    "title": "J’interviens à l'initiative d'ORES sur un « gamme B » cassé et dont la colonne est ok avec un compteur mono 50 A, comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/3f14e282-d5bb-4749-b4d9-2e262e81d95f",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je place un tableautin, j’installe un compteur mono que je configure à 40 A et un disjoncteur mono 50 A",
        "isCorrect": false
      },
      {
        "text": "Je place un 25D60, j’installe un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 63 A",
        "isCorrect": false
      },
      {
        "text": "Je place un 25D60, j’installe un compteur mono que je configure à MAX (999 A) et un disjoncteur mono 50 A",
        "isCorrect": true
      },
      {
        "text": "Je place un kit NH, j’installe un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 63 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r256934b2041c437b8f2e23ff0e6d8a6e",
    "number": 86,
    "title": "J’interviens à l'initiative d'ORES sur un comptage résidentiel mono 50 A en mauvais état et la colonne est à remplacer. Comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/b1786c3a-ec53-4ac5-93f0-1f04a73f1f93",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je remplace la colonne, je place un 25D60 , j’installe un compteur tri/tétra que je configure à MAX (999 A) et un disjoncteur tri/tétra 50 A",
        "isCorrect": true
      },
      {
        "text": "Je remplace la colonne, je place un  25D60, j’installe un compteur mono que je configure à 50 A et un disjoncteur mono 50 A",
        "isCorrect": false
      },
      {
        "text": "Je remplace la colonne, je place un  25D60 , j’installe un compteur tri/tétra que je configure à 50 A Disjoncteur tétra 50 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r2b334c6fe3b948c1afbcb167b03086db",
    "number": 87,
    "title": "J’interviens sur un vieux compteur que dois-je faire impérativement avant tout                         démontage ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/00cdf129-4224-4b74-a5ed-2941c4207228",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je place de la toile isolante sur les parties actives visibles",
        "isCorrect": false
      },
      {
        "text": "Je porte mes EPI  et je ressers toutes les bornes",
        "isCorrect": true
      },
      {
        "text": "Je porte mes EPI et démonte fil par fil",
        "isCorrect": false
      },
      {
        "text": "Je procède à une coupure côté réseau",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rc6e9b19115a24e8db865f755c29b8391",
    "number": 88,
    "title": "A partir de quand le compteur est-il en mode prépaiement ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Immédiatement",
        "isCorrect": false
      },
      {
        "text": "Après le provisioning (1 à 3 jours)",
        "isCorrect": true
      },
      {
        "text": "1 jour après la pose",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r02fb3b8b70774b18868a89162b04fb72",
    "number": 89,
    "title": "Le client possède un crédit de secours de :",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "10€",
        "isCorrect": false
      },
      {
        "text": "15€",
        "isCorrect": true
      },
      {
        "text": "20€",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r04adedeebf5c41feb4373d7800eb3cb6",
    "number": 90,
    "title": "Comment place-t-on un compteur communicant si chez le client le compteur existant est sur un tableautin métallique ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "On adapte le tableautin",
        "isCorrect": false
      },
      {
        "text": "On ne fait rien si on a pas la place pour placer un 25D60",
        "isCorrect": false
      },
      {
        "text": "On retire le tableautin et suivant la surface existante, on place soit un 25D60 soit un tableautin",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rfd094b9a7e3e419386f438b58ea23d17",
    "number": 91,
    "title": "J’interviens sur un coffret 25S60 avec un sectionneur unipolaire, que vais-je faire ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/e6bebe22-d934-4944-9625-6ca1ce5aa78f",
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Je le laisse car il est encore en bon état",
        "isCorrect": false
      },
      {
        "text": "Je le remplace par sectionneur rotatif 125 A coupant les 3 phases et le neutre",
        "isCorrect": true
      },
      {
        "text": "Je ne fais rien je n’ai pas le matériel adapté",
        "isCorrect": false
      },
      {
        "text": "Je le remplace par un disjoncteur tétra de 125 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r7f83b34fb94444aa8144e7d65d6653e6",
    "number": 92,
    "title": "Comment déterminer la section des fils lors d’un remplacement d’un compteur existant ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Je prends un pied à coulisse",
        "isCorrect": false
      },
      {
        "text": "Je compare avec d’autres fils de section différente que j’ai en ma possession",
        "isCorrect": false
      },
      {
        "text": "J’utilise le « Flipo »",
        "isCorrect": false
      },
      {
        "text": "Je regarde le marquage sur le câble et/ou le « Flipo »",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rbc00d0573afa4240a550b9ba4ebbe7bc",
    "number": 93,
    "title": "Que signifie le code Obis 17.0.0 ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/620cf835-6fc9-4cbd-b2ea-702265798f6a",
    "category": "Codes OBIS & Écran",
    "choices": [
      {
        "text": "Limite Ampère",
        "isCorrect": false
      },
      {
        "text": "Limite puissance",
        "isCorrect": true
      },
      {
        "text": "Info budget",
        "isCorrect": false
      },
      {
        "text": "Pointe quart horaire",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r564bd42dc29d4d8b8b71c3a321f95194",
    "number": 94,
    "title": "Je remplace un tableautin métallique par un tableautin réduit, quel kit fil vais-je utiliser ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Je remplace le kit fourni par un kit 25 mm²",
        "isCorrect": false
      },
      {
        "text": "Je récupère le kit fil du tableautin métallique",
        "isCorrect": false
      },
      {
        "text": "Je place le kit fil fourni avec en 16 mm²",
        "isCorrect": true
      },
      {
        "text": "Je remplace le kit fourni par un kit 25 mm² prévu pour le NH",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rfbcbfbed1a6744fc8ab393df4953aba2",
    "number": 95,
    "title": "On remplace le compteur Tétra en immeuble à l’initiative d’ORES, l’installation est : disjoncteur réglable 15/40 10 kA en 25S60 réglé sur 25 A. Quels seront les réglages ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Valeur de réglage compteur à 25 A, disjoncteur réglé sur 40 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à 25 A, disjoncteur réglé sur 25 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à 25 A, on remplace le disjoncteur par un DIN 40 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à MAX (999 A) on remplace le disjoncteur par un DIN 25 A.",
        "isCorrect": true
      },
      {
        "text": "Valeur de réglage compteur à 40 A, disjoncteur réglé sur 25 A.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rb2f86b4dfac64abd95e8357dd23f8c6f",
    "number": 96,
    "title": "Je remplace le compteur à l’initiative d’ORES. Installation mono 40A en Fix-O-rail sans sectionneur. Quels seront les réglages ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Valeur de réglage compteur à MAX (999 A), disjoncteur de 40 A.",
        "isCorrect": true
      },
      {
        "text": "Valeur de réglage compteur à 40 A, disjoncteur de 63 A.",
        "isCorrect": false
      },
      {
        "text": "Impossibilité technique.",
        "isCorrect": false
      },
      {
        "text": "Je remplace toujours le tout par un 25D60, et je règle à 40 A sur tout",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r9cbb825154d743e3b5df726f7d313338",
    "number": 97,
    "title": "Je remplace le compteur à l’initiative d’ORES. Installation mono 63 A sur tableautin câbles de raccordement. Quel sera le type de compteur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Un compteur mono",
        "isCorrect": false
      },
      {
        "text": "Un compteur tri/tétra sortie mono",
        "isCorrect": true
      },
      {
        "text": "Un compteur tri/tétra sortie tri/tétra",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r1289bee2d8c04917adc27e20a55c48da",
    "number": 98,
    "title": "On remplace le compteur Tétra EXN en 25S60 à l’initiative d’ORES, l’installation est : disjoncteur réglable 10 kA sur 50 A. Quels seront les réglages ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Valeur de réglage compteur à 50 A, disjoncteur réglé sur 60 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à 60 A, disjoncteur réglé sur 50 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur réglage compteur réglé sur MAX, disjoncteur réglé sur 50 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur réglage compteur réglé sur MAX, disjoncteur remplacé par un DIN de 50 A.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rf9c58ff727f44dc3968c8993dd9de5a8",
    "number": 99,
    "title": "Comment raccorde-t-on un client raccordé en mono 63 A sur un réseau 230 V ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Raccorder le compteur en triphasé avec le kit adapté qui comprend le pontage entre entrée L2 et entrée N. Sortie client entre deux phases.",
        "isCorrect": true
      },
      {
        "text": "Raccorder le compteur en triphasé avec le kit adapté qui comprend le pontage entre entrée L2 et entrée N. Sortie client en triphasé.",
        "isCorrect": false
      },
      {
        "text": "Raccorder le compteur en triphasé avec le kit adapté qui comprend le pontage entre entrée L2 et entrée N. Sortie client entre phase et neutre.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rda34ddf29b5f41cba094f201c0d9806c",
    "number": 100,
    "title": "Comment activer le mode avion d’un compteur communicant ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/b8f5f00f-20ad-4708-9b1a-0bb36e3737d2",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Lorsque le client refuse la fonction communicante du compteur, le mode avion est activé par une téléopération.",
        "isCorrect": true
      },
      {
        "text": "À la demande du client, je peux activer le mode avion en local. Ensuite c’est payant.",
        "isCorrect": false
      },
      {
        "text": "J’active d’office le mode avion, le réseau sera plus rapide .",
        "isCorrect": false
      },
      {
        "text": "Il n’est plus possible de désactiver le mode avion car celui-ci empêche le bon fonctionnement du compteur",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r6f3c796510884aef90ecb6fcf22a99ef",
    "number": 101,
    "title": "En intervenant sur le compteur d’un client, je découvre ce câble en sortie compteur. Comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/3d8f2442-b051-4568-bfd0-3b4248ca8c92",
    "category": "Câblage & Raccordement",
    "choices": [
      {
        "text": "Je remets une gaine thermo et je rebranche le câble.",
        "isCorrect": false
      },
      {
        "text": "Les phases ne sont pas abimées, je le laisse.",
        "isCorrect": false
      },
      {
        "text": "Je le remplace par un câble XGB et je reconnecte le câble client via la boite de dérivation car je dois sécuriser le comptage.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r81fab917a2f844e88101270a5376e1ba",
    "number": 102,
    "title": "Lors d’un renforcement de compteur à l'initiative client, quel ampérage dois-je régler sur le nouveau disjoncteur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Une valeur plus petite que l’ancien disjoncteur.",
        "isCorrect": false
      },
      {
        "text": "La valeur I Max reprise sur l'OA.",
        "isCorrect": true
      },
      {
        "text": "Une valeur plus élevée que l’ancien disjoncteur.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rd6564cecf2ff408ca32277fa82893f1c",
    "number": 103,
    "title": "Identifiez le type de coffret.",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/e6fa2f66-6c39-48a2-ac47-1ab998810fba",
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Fix-O-Rail",
        "isCorrect": false
      },
      {
        "text": "Vynckier7",
        "isCorrect": false
      },
      {
        "text": "Gamme B",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r7347f4b3b3ab4f6fb64f03505aa4f9fb",
    "number": 104,
    "title": "Quel est le seul organe de sécurité reconnu par le GRD ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Sécurité & EPI",
    "choices": [
      {
        "text": "Breaker interne",
        "isCorrect": false
      },
      {
        "text": "Disjoncteur",
        "isCorrect": true
      },
      {
        "text": "Le sectionneur",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rca9ed55fe5734f1795331d9b32b50ff2",
    "number": 105,
    "title": "Comment le client peut-il ouvrir l’organe de coupure interne du compteur quand il est fermé?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "En appuyant 5 secondes sur le bouton vert",
        "isCorrect": false
      },
      {
        "text": "En appuyant 5 secondes sur le bouton blanc",
        "isCorrect": false
      },
      {
        "text": "Ce n’est pas possible",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r6be3edad61044cd5814f672e278c78a3",
    "number": 106,
    "title": "Quelle est l’intensité maximale admissible pour un coffret DIN sur Tableautin en Tri Tétra ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "32 A",
        "isCorrect": false
      },
      {
        "text": "80 A",
        "isCorrect": true
      },
      {
        "text": "50 A",
        "isCorrect": false
      },
      {
        "text": "63 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rc8d34de720cd4df9a2d6b9ad1b445ee0",
    "number": 107,
    "title": "J’interviens sur un coffret 25D60  à l'initiative d'ORES en bon état avec un compteur mono 50 A, comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Je garde le coffret, je place un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 63A",
        "isCorrect": false
      },
      {
        "text": "Je garde le coffret, je place un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 50 A",
        "isCorrect": false
      },
      {
        "text": "Je garde le coffret, je place un compteur mono que je configure à MAX (999 A) et un disjoncteur mono 50 A",
        "isCorrect": true
      },
      {
        "text": "Je garde le coffret, je place un compteur mono que je configure à 50 A et un disjoncteur mono 63 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r8721b7669974437eb77c33a7da797b48",
    "number": 108,
    "title": "J’interviens sur un « gamme B » cassé à l'initiative d'ORES avec un compteur mono 50 A, comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je place un tableautin, j’installe un compteur mono que je configure à 40 A et un disjoncteur mono 50 A",
        "isCorrect": false
      },
      {
        "text": "Je place un 25D60, j’installe un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 63 A",
        "isCorrect": false
      },
      {
        "text": "Je place un 25D60, j’installe un compteur mono que je configure à MAX (999 A) et un disjoncteur mono 50 A",
        "isCorrect": true
      },
      {
        "text": "Je place un kit NH, j’installe un compteur tri/tétra que je configure à 50 A et un disjoncteur tri/tétra 63 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rfadc8d5af504421aa4dc198d0259ad68",
    "number": 109,
    "title": "J’interviens à l'initiative d'ORES sur un comptage résidentiel mono 50 A en mauvais état et la colonne est à remplacer. Comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je remplace la colonne, je place un 25D60 , j’installe un compteur tri/tétra que je configure à MAX (999 A) et un disjoncteur tri/tétra 50 A",
        "isCorrect": true
      },
      {
        "text": "Je remplace la colonne, je place un  25D60, j’installe un compteur mono que je configure à 50 A et un disjoncteur mono 63 A",
        "isCorrect": false
      },
      {
        "text": "Je remplace la colonne, je place un  25D60 , j’installe un compteur tri/tétra que je configure à 50 A disjoncteur tétra 50 A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r7e46efd50e5044b58c5670a6c96b7ce9",
    "number": 110,
    "title": "Que faire quand une fraude est constatée ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Informer le client ainsi que le service fraude.",
        "isCorrect": false
      },
      {
        "text": "Ne pas informer le client, démonter le compteur incriminé et l’envoyer au service fraude.",
        "isCorrect": false
      },
      {
        "text": "Ne pas informer le client, ne pas modifier la situation et prévenir le responsable.",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r0ef0a0ec6fc0424abfa9759c8f7b593b",
    "number": 111,
    "title": "Quand le solde sera t’il affiché sur le compteur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "1 jour après la création du compte PPP",
        "isCorrect": true
      },
      {
        "text": "Immédiatement",
        "isCorrect": false
      },
      {
        "text": "Dès la création du compte en PPP",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rffa42fe88148499f8d1b5ce0f29a076a",
    "number": 112,
    "title": "Quel est le montant du crédit de départ lors de la nouvelle pose d'un compteur communicant ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "15€",
        "isCorrect": false
      },
      {
        "text": "20€",
        "isCorrect": true
      },
      {
        "text": "50€",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rdc4dc0a0bc0a4a5a8ad641477511289e",
    "number": 113,
    "title": "Quelles sont les 3 conditions pour un travail sous tension ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Avoir une installation saine",
        "isCorrect": true
      },
      {
        "text": "Avoir tous ses EPI",
        "isCorrect": false
      },
      {
        "text": "Avoir une méthode de travail",
        "isCorrect": true
      },
      {
        "text": "Avoir une exigence impérative de service",
        "isCorrect": true
      },
      {
        "text": "Avoir l’accord du responsable ORES",
        "isCorrect": false
      },
      {
        "text": "Avoir placer les EPC",
        "isCorrect": false
      }
    ],
    "isMultiple": true,
    "points": 4
  },
  {
    "id": "r92899224489447d0bc770790c257814e",
    "number": 114,
    "title": "Je viens remplacer un compteur existant, quelles mesures dois-je faire impérativement avant le démontage du compteur ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "Je prends les différentes tensions, identifie le Neutre si présent, le champ tournant et je vérifie les sections avec le « Flipo »",
        "isCorrect": true
      },
      {
        "text": "Je prends les différentes tensions, courants et index",
        "isCorrect": false
      },
      {
        "text": "Je prends les couleurs des fils et les remettrai au même endroit au nouveau comptage",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r769947ad1faf498fb06345979bec1803",
    "number": 115,
    "title": "Lors de mon intervention sur un comptage existant, un contact libre de potentiel de la RTCC est raccordé. Que fait-on ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Tarif & RTCC",
    "choices": [
      {
        "text": "Je retire la RTCC car ORES ne fournit plus le contact libre de potentiel",
        "isCorrect": false
      },
      {
        "text": "Je retire la RTCC et raccorde le câble client aux deux petites bornes du compteur",
        "isCorrect": false
      },
      {
        "text": "Je laisse la RTCC et ne câble que le contact libre de potentiel",
        "isCorrect": true
      },
      {
        "text": "Je ne fais rien car je ne sais pas à quoi sert le libre de potentiel et je demande au client de remettre son installation en ordre",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r47cefd8272be429296f5e9ac75d7becb",
    "number": 116,
    "title": "Comment sceller un tableautin réduit ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Je passe le fil de scellé dans les 3 vis de serrage et place 1 scellé + les 2 scellés du compteur",
        "isCorrect": true
      },
      {
        "text": "Un scellé par vis + les 2 scellés du compteur",
        "isCorrect": false
      },
      {
        "text": "Je ne scelle que la vis bleue + les 2 scellés du compteur",
        "isCorrect": false
      },
      {
        "text": "Je scelle le compteur avec 2 scellés",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r977c873db7a741a29d210d63fb585e39",
    "number": 117,
    "title": "On remplace le compteur Tri à l’initiative d’ORES, l’installation est : disjoncteur réglable 39/63A 10 kA en tableautin réglé sur 51 A. Quelles seront les réglages ?",
    "subtitle": null,
    "imageUrl": null,
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Valeur de réglage compteur à 63 A, disjoncteur réglé sur 63 A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à MAX (999 A), disjoncteur réglé sur 51 A.",
        "isCorrect": true
      },
      {
        "text": "Valeur de réglage compteur à 63 A, disjoncteur réglé sur 51 A",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à 63 A, on remplace le disjoncteur par un DIN 63A.",
        "isCorrect": false
      },
      {
        "text": "Valeur de réglage compteur à 51 A, on remplace le disjoncteur par un DIN 63A.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rc6c833a88bcc4500aaf8aa2c1a37a7ae",
    "number": 118,
    "title": "Je réalise un renforcement de compteur à la demande du client en résidentiel, quelles seront les valeurs de disjoncteur et breaker?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/436fa8f0-bce0-4e83-8129-ea9393df2ab2",
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Breaker à la valeur contractuelle et le disjoncteur à la valeur de l’O.A",
        "isCorrect": true
      },
      {
        "text": "Breaker sur MAX et disjoncteur à la valeur de l’O.A",
        "isCorrect": false
      },
      {
        "text": "Breaker à la valeur contractuelle et disjoncteur à la valeur contractuelle.",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r805a822564974181aa4369230cbed015",
    "number": 119,
    "title": "Je remplace un compteur à demande client, compteur mono 40A, le coffret est cassé. Le client demande un renforcement à mono 50A, O.A 63A, réseau 400V. Comment vais-je procéder ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/169dc678-c306-42a7-b936-cfa8ceecfb63",
    "category": "Coffret 25S60 & Plastrons",
    "choices": [
      {
        "text": "Je place un tableautin, j’installe un compteur mono que je configure à 40 A et un disjoncteur mono 50 A",
        "isCorrect": false
      },
      {
        "text": "Je place un 25D60, j’installe un compteur tri/tétra que je configure sur MAX et un disjoncteur tri/tétra 63 A",
        "isCorrect": false
      },
      {
        "text": "Je place un 25D60, j’installe un compteur mono que je configure à 50A et un disjoncteur mono 50A",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r53138225fb694a03b4563566503b82ad",
    "number": 120,
    "title": "En cas de renforcement de compteur  à l’initiative client, le breaker sera réglé sur :",
    "subtitle": null,
    "imageUrl": null,
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "MAX",
        "isCorrect": false
      },
      {
        "text": "La puissance contractuelle",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "rb4f13545ec394215a21006f08e56c51d",
    "number": 121,
    "title": "Dans un immeuble à appartement, lors d’une demande client de renforcement compteur, on ne fait pas de modulation. Cela signifie :",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/1bd8ea3a-6037-46e3-91da-c3f034d8b439",
    "category": "Compteur & Procédure",
    "choices": [
      {
        "text": "La valeur du disjoncteur ne sera pas égale à la valeur du breaker.",
        "isCorrect": false
      },
      {
        "text": "La valeur du disjoncteur sera égale à la valeur du breaker",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r4004af04b08447fab6d9a87e9c23af6e",
    "number": 122,
    "title": "On remplace et renforce un compteur, en résidentiel, à la demande du client. Le client demande un Tétra 25A, O.A. de 40 A. Quelles seront les valeurs de disjoncteur et de breaker ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/eac533cf-4d88-4640-a04f-8e2e067844f2",
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Disjoncteur 40A, Breaker 25A",
        "isCorrect": true
      },
      {
        "text": "Disjoncteur 25A, Breaker Max",
        "isCorrect": false
      },
      {
        "text": "Disjoncteur 25A, Breaker 25A",
        "isCorrect": false
      }
    ],
    "isMultiple": false,
    "points": 4
  },
  {
    "id": "r6bf5e54bcb9543f99886adfcc6291b9c",
    "number": 123,
    "title": "On remplace et renforce un compteur à la demande du client dans un immeuble collectif . Le client demande un Tétra 25A, O.A. de 40 A. Quelles seront les valeurs de disjoncteur et de breaker ?",
    "subtitle": null,
    "imageUrl": "https://hive.forms.usercontent.microsoft/images/68e9eab2-b23f-4b2e-b1bb-dc097aa42c7b/8d1c926c-8ad5-4e2e-8b4a-3014dc975483/T5NWIQ1S2EKFFJ3D49BG7G8Q54/dde44079-9674-4f12-aac9-92b6e7d99ee0",
    "category": "Disjoncteurs & Breaker",
    "choices": [
      {
        "text": "Disjoncteur 40A, Breaker 25A",
        "isCorrect": false
      },
      {
        "text": "Disjoncteur 25A, Breaker Max",
        "isCorrect": false
      },
      {
        "text": "Disjoncteur 25A, Breaker 25A",
        "isCorrect": true
      }
    ],
    "isMultiple": false,
    "points": 4
  }
];
