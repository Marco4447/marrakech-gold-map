/**
 * Generates and downloads a CSV template for importing partner prospects into Notion.
 */
export function downloadPartnerCsvTemplate() {
  const headers = [
    "Nom du lieu",
    "Catégorie",
    "Quartier",
    "Statut",
    "Priorité",
    "Instagram",
    "WhatsApp",
    "Contact nom",
    "Date 1er contact",
    "Date relance",
    "Crédits offerts",
    "Lien fiche app",
    "Lien invite",
    "Notes",
  ];

  const exampleRows = [
    [
      "Le Jardin Secret",
      "Restaurant & Café",
      "Medina",
      "🔍 Prospect",
      "🔥 Hot",
      "https://instagram.com/lejardinsecret",
      "+212 6XX XX XX XX",
      "Youssef",
      "2026-03-12",
      "2026-03-14",
      "15",
      "https://marrakech-gold-map.lovable.app/place/le-jardin-secret",
      "",
      "Liké 3 posts, prêt pour DM",
    ],
    [
      "Sky Lounge MK",
      "Rooftop & Bar",
      "Guéliz",
      "💬 Contacté",
      "🟡 Medium",
      "https://instagram.com/skyloungemk",
      "+212 6XX XX XX XX",
      "Sara",
      "2026-03-10",
      "2026-03-15",
      "15",
      "",
      "",
      "DM envoyé J0, en attente de réponse",
    ],
    [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "15",
      "",
      "",
      "",
    ],
  ];

  const csvContent = [
    headers.join(","),
    ...exampleRows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const BOM = "\uFEFF"; // UTF-8 BOM for Excel/Notion accent support
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "weshkech-partenaires-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
