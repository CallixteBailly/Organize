# Quick Capture - Cas d'utilisation testes

Feature "Saisie rapide" (bouton ⚡) : le mecanicien tape ou dicte une phrase en francais et l'IA (Z.AI GLM-4.7) extrait automatiquement client, vehicule, prestation, montant et paiement.

**API** : Z.AI (GLM-4.7) via LangChain OpenAI-compatible
**Date des tests** : 28 mars 2026

---

## Test 1 — Basique avec paiement CB

**Prompt** : `Vidange Clio 4 de Martin, 180€, paye CB`

**Extraction IA** :
| Champ | Resultat |
|-------|----------|
| Client | Martin (Nouveau) |
| Vehicule | Renault Clio 4 (Nouveau) |
| Prestation | Vidange |
| Montant TTC | 180 € |
| Paiement | Carte bancaire |

**Resultat** : OR-00001 + Facture FA-00001 crees
- MO HT : 150,00 € (back-calcul 180 / 1.20)
- TVA : 30,00 €
- Total TTC : 180,00 €
- Statut : Facture (paiement enregistre)

---

## Test 2 — Avec montant, sans paiement

**Prompt** : `Changement plaquettes avant 308 de Dupont, 250€`

**Extraction IA** :
| Champ | Resultat |
|-------|----------|
| Client | Dupont (Nouveau) |
| Vehicule | Peugeot 308 (Nouveau) |
| Prestation | Changement plaquettes avant |
| Montant TTC | 250 € |
| Paiement | Non detecte |

**Resultat** : OR-00002 cree (pas de facture car pas de paiement)
- MO HT : 208,33 €
- TVA : 41,67 €
- Total TTC : 250,00 €
- Statut : Brouillon

---

## Test 3 — Avec plaque d'immatriculation

**Prompt** : `Diagnostic climatisation Golf 7 AB-123-CD client Lambert`

**Extraction IA** :
| Champ | Resultat |
|-------|----------|
| Client | Lambert (Nouveau) |
| Vehicule | Volkswagen Golf 7 — AB123CD (Nouveau) |
| Prestation | Diagnostic climatisation |
| Montant TTC | 0 € |
| Paiement | Non detecte |

**Points notables** :
- "Golf 7" correctement mappe vers "Volkswagen"
- Plaque "AB-123-CD" normalisee en "AB123CD"
- Plaque affichee dans la fiche OR

**Resultat** : OR-00003 cree

---

## Test 4 — Prompt complet (nom compose + paiement + kilometrage)

**Prompt** : `Revision complete 206 de Jean-Pierre Moreau, 350€ paye especes, kilometrage 85000`

**Extraction IA** :
| Champ | Resultat |
|-------|----------|
| Client | Jean-Pierre Moreau (Nouveau) |
| Vehicule | Peugeot 206 (Nouveau) |
| Prestation | Revision complete |
| Montant TTC | 350 € |
| Paiement | Especes |
| Kilometrage | 85 000 km |

**Points notables** :
- Prenom compose "Jean-Pierre" correctement separe du nom "Moreau"
- Kilometrage extrait et affiche dans la fiche OR
- Paiement "especes" mappe vers "cash"

**Resultat** : OR-00004 + Facture FA-00002 crees
- MO HT : 291,67 €
- TVA : 58,33 €

---

## Test 5 — Paiement cheque + Mme

**Prompt** : `Courroie distribution Megane de Mme Bernard, 450€ paye cheque`

**Extraction IA** :
| Champ | Resultat |
|-------|----------|
| Client | Bernard (Nouveau) |
| Vehicule | Renault Megane (Nouveau) |
| Prestation | Courroie distribution |
| Montant TTC | 450 € |
| Paiement | Cheque |

**Points notables** :
- "Mme" extraite, nom "Bernard" correctement isole
- "Megane" mappe vers "Renault"
- "cheque" mappe vers "check"

**Resultat** : OR-00005 + Facture FA-00003 crees
- MO HT : 375,00 €
- TVA : 75,00 €

---

## Test 6 — Client entreprise

**Prompt** : `Entretien Sprinter Garage Auto Express, 500€ paye CB`

**Extraction IA** :
| Champ | Resultat |
|-------|----------|
| Client | Garage Auto Express (companyName, Nouveau) |
| Vehicule | Mercedes Sprinter (Nouveau) |
| Prestation | Entretien Sprinter |
| Montant TTC | 500 € |
| Paiement | Carte bancaire |

**Points notables** :
- "Garage Auto Express" detecte comme nom d'entreprise (pas un nom de personne)
- "Sprinter" mappe vers "Mercedes"

**Resultat** : OR-00006 + Facture FA-00004 crees
- MO HT : 416,67 €
- TVA : 83,33 €

---

## Test 7 — Prestation rapide minimale

**Prompt** : `Diagnostic moteur Audi A3`

**Extraction IA** :
| Champ | Resultat |
|-------|----------|
| Client | Non detecte (Nouveau) |
| Vehicule | Audi A3 (Nouveau) |
| Prestation | Diagnostic moteur |
| Montant TTC | 0 € |
| Paiement | Non detecte |

**Points notables** :
- Pas de nom de client → affiche "Non detecte" avec badge Nouveau
- L'utilisateur peut modifier avant de confirmer
- Fonctionne meme avec tres peu d'informations

---

## Resume

| # | Prompt | Client | Vehicule | Montant | Paiement | Resultat |
|---|--------|--------|----------|---------|----------|----------|
| 1 | Vidange Clio 4 de Martin, 180€, paye CB | Martin | Renault Clio 4 | 180€ | CB | OR + FA |
| 2 | Changement plaquettes avant 308 de Dupont, 250€ | Dupont | Peugeot 308 | 250€ | — | OR seul |
| 3 | Diagnostic climatisation Golf 7 AB-123-CD client Lambert | Lambert | VW Golf 7 (AB123CD) | — | — | OR seul |
| 4 | Revision complete 206 de Jean-Pierre Moreau, 350€ paye especes, km 85000 | Jean-Pierre Moreau | Peugeot 206 | 350€ | Especes | OR + FA |
| 5 | Courroie distribution Megane de Mme Bernard, 450€ paye cheque | Bernard | Renault Megane | 450€ | Cheque | OR + FA |
| 6 | Entretien Sprinter Garage Auto Express, 500€ paye CB | Garage Auto Express | Mercedes Sprinter | 500€ | CB | OR + FA |
| 7 | Diagnostic moteur Audi A3 | Non detecte | Audi A3 | — | — | OR seul |

**7/7 tests reussis** — toutes les extractions sont correctes.
