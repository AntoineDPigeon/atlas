import {ports} from '../dist/data.js';

// Canonical cruise-port lookups. Client text is never forwarded to Google.
const additionalPorts = [
  {
    "id": "ACE",
    "name": "Arrecife",
    "lat": 28.96,
    "lon": -13.54
  },
  {
    "id": "AGA",
    "name": "Agadir",
    "lat": 30.42,
    "lon": -9.6
  },
  {
    "id": "AJA",
    "name": "Ajaccio",
    "lat": 41.92,
    "lon": 8.74
  },
  {
    "id": "ALC",
    "name": "Alicante",
    "lat": 38.34,
    "lon": -0.49
  },
  {
    "id": "BAR",
    "name": "Bar Montenegro",
    "lat": 42.1,
    "lon": 19.09
  },
  {
    "id": "BBO",
    "name": "Bilbao",
    "lat": 43.35,
    "lon": -3.05
  },
  {
    "id": "BRI",
    "name": "Bari",
    "lat": 41.13,
    "lon": 16.86
  },
  {
    "id": "CAG",
    "name": "Cagliari",
    "lat": 39.21,
    "lon": 9.11
  },
  {
    "id": "CAR",
    "name": "Cartagena Spain",
    "lat": 37.6,
    "lon": -0.98
  },
  {
    "id": "CAS",
    "name": "Casablanca",
    "lat": 33.61,
    "lon": -7.62
  },
  {
    "id": "CFU",
    "name": "Corfu",
    "lat": 39.62,
    "lon": 19.91
  },
  {
    "id": "CTA",
    "name": "Catania",
    "lat": 37.5,
    "lon": 15.09
  },
  {
    "id": "FNC",
    "name": "Funchal",
    "lat": 32.64,
    "lon": -16.91
  },
  {
    "id": "GIB",
    "name": "Gibraltar",
    "lat": 36.14,
    "lon": -5.35
  },
  {
    "id": "GIJ",
    "name": "Gijon",
    "lat": 43.55,
    "lon": -5.68
  },
  {
    "id": "IBZ",
    "name": "Ibiza",
    "lat": 38.91,
    "lon": 1.44
  },
  {
    "id": "IJM",
    "name": "IJmuiden",
    "lat": 52.46,
    "lon": 4.59
  },
  {
    "id": "IST",
    "name": "Istanbul",
    "lat": 41.03,
    "lon": 28.99
  },
  {
    "id": "KAK",
    "name": "Katakolon",
    "lat": 37.65,
    "lon": 21.32
  },
  {
    "id": "KOP",
    "name": "Koper",
    "lat": 45.55,
    "lon": 13.73
  },
  {
    "id": "KUS",
    "name": "Kusadasi",
    "lat": 37.86,
    "lon": 27.26
  },
  {
    "id": "LCG",
    "name": "La Coruna",
    "lat": 43.37,
    "lon": -8.4
  },
  {
    "id": "LEH",
    "name": "Le Havre",
    "lat": 49.49,
    "lon": 0.11
  },
  {
    "id": "LGN",
    "name": "La Goulette",
    "lat": 36.82,
    "lon": 10.31
  },
  {
    "id": "LIV",
    "name": "Livorno",
    "lat": 43.55,
    "lon": 10.3
  },
  {
    "id": "LPA",
    "name": "Las Palmas",
    "lat": 28.14,
    "lon": -15.42
  },
  {
    "id": "LRH",
    "name": "La Rochelle",
    "lat": 46.16,
    "lon": -1.2
  },
  {
    "id": "LVN",
    "name": "Le Verdon",
    "lat": 45.55,
    "lon": -1.06
  },
  {
    "id": "LXO",
    "name": "Leixoes",
    "lat": 41.18,
    "lon": -8.7
  },
  {
    "id": "MLN",
    "name": "Melilla",
    "lat": 35.29,
    "lon": -2.94
  },
  {
    "id": "MOT",
    "name": "Motril",
    "lat": 36.72,
    "lon": -3.52
  },
  {
    "id": "MSN",
    "name": "Messina",
    "lat": 38.19,
    "lon": 15.56
  },
  {
    "id": "PDL",
    "name": "Ponta Delgada",
    "lat": 37.74,
    "lon": -25.67
  },
  {
    "id": "PDR",
    "name": "Puerto del Rosario",
    "lat": 28.5,
    "lon": -13.86
  },
  {
    "id": "PMO",
    "name": "Palermo",
    "lat": 38.12,
    "lon": 13.37
  },
  {
    "id": "PRM",
    "name": "Portimao",
    "lat": 37.13,
    "lon": -8.54
  },
  {
    "id": "RAV",
    "name": "Ravenna",
    "lat": 44.49,
    "lon": 12.28
  },
  {
    "id": "RJK",
    "name": "Rijeka",
    "lat": 45.33,
    "lon": 14.44
  },
  {
    "id": "SAL",
    "name": "Salerno",
    "lat": 40.67,
    "lon": 14.76
  },
  {
    "id": "SCP",
    "name": "Santa Cruz de La Palma",
    "lat": 28.68,
    "lon": -17.77
  },
  {
    "id": "SCT",
    "name": "Santa Cruz de Tenerife",
    "lat": 28.47,
    "lon": -16.25
  },
  {
    "id": "SPE",
    "name": "La Spezia",
    "lat": 44.1,
    "lon": 9.83
  },
  {
    "id": "SPU",
    "name": "Split",
    "lat": 43.51,
    "lon": 16.44
  },
  {
    "id": "TAR",
    "name": "Tarragona",
    "lat": 41.11,
    "lon": 1.25
  },
  {
    "id": "TLN",
    "name": "Toulon",
    "lat": 43.12,
    "lon": 5.93
  },
  {
    "id": "TNG",
    "name": "Tangier",
    "lat": 35.79,
    "lon": -5.81
  },
  {
    "id": "VCE",
    "name": "Trieste",
    "lat": 45.65,
    "lon": 13.77
  },
  {
    "id": "VLC",
    "name": "Valencia",
    "lat": 39.45,
    "lon": -0.32
  },
  {
    "id": "VLF",
    "name": "Villefranche sur Mer",
    "lat": 43.7,
    "lon": 7.31
  },
  {
    "id": "ZAD",
    "name": "Zadar",
    "lat": 44.12,
    "lon": 15.23
  },
  {
    "id": "ZEE",
    "name": "Zeebrugge",
    "lat": 51.33,
    "lon": 3.2
  },
  {
    "id": "REY",
    "name": "Reykjavik",
    "lat": 64.15,
    "lon": -21.94
  },
  {
    "id": "AKU",
    "name": "Akureyri",
    "lat": 65.68,
    "lon": -18.09
  },
  {
    "id": "ISA",
    "name": "Isafjordur",
    "lat": 66.07,
    "lon": -23.13
  },
  {
    "id": "HVG",
    "name": "Honningsvag",
    "lat": 70.98,
    "lon": 25.98
  },
  {
    "id": "TOS",
    "name": "Tromso",
    "lat": 69.65,
    "lon": 18.96
  },
  {
    "id": "TRD",
    "name": "Trondheim",
    "lat": 63.43,
    "lon": 10.4
  },
  {
    "id": "MOL",
    "name": "Molde",
    "lat": 62.74,
    "lon": 7.16
  },
  {
    "id": "FLM",
    "name": "Flam",
    "lat": 60.86,
    "lon": 7.11
  },
  {
    "id": "OLD",
    "name": "Olden",
    "lat": 61.83,
    "lon": 6.8
  },
  {
    "id": "HAU",
    "name": "Haugesund",
    "lat": 59.41,
    "lon": 5.27
  },
  {
    "id": "STA",
    "name": "Stavanger",
    "lat": 58.97,
    "lon": 5.73
  },
  {
    "id": "KRS",
    "name": "Kristiansand",
    "lat": 58.15,
    "lon": 8
  },
  {
    "id": "OSL",
    "name": "Oslo",
    "lat": 59.91,
    "lon": 10.74
  },
  {
    "id": "KIE",
    "name": "Kiel",
    "lat": 54.32,
    "lon": 10.14
  },
  {
    "id": "WAR",
    "name": "Warnemunde",
    "lat": 54.18,
    "lon": 12.09
  },
  {
    "id": "GDY",
    "name": "Gdynia",
    "lat": 54.54,
    "lon": 18.55
  },
  {
    "id": "RIX",
    "name": "Riga",
    "lat": 56.95,
    "lon": 24.11
  },
  {
    "id": "KLA",
    "name": "Klaipeda",
    "lat": 55.71,
    "lon": 21.13
  },
  {
    "id": "VIS",
    "name": "Visby",
    "lat": 57.64,
    "lon": 18.29
  },
  {
    "id": "NYN",
    "name": "Nynashamn",
    "lat": 58.9,
    "lon": 17.95
  },
  {
    "id": "HAM",
    "name": "Hamburg",
    "lat": 53.54,
    "lon": 9.98
  },
  {
    "id": "DOV",
    "name": "Dover",
    "lat": 51.12,
    "lon": 1.31
  },
  {
    "id": "BEL",
    "name": "Belfast",
    "lat": 54.62,
    "lon": -5.9
  },
  {
    "id": "DUB",
    "name": "Dublin",
    "lat": 53.35,
    "lon": -6.2
  },
  {
    "id": "COB",
    "name": "Cobh",
    "lat": 51.85,
    "lon": -8.29
  },
  {
    "id": "LIVP",
    "name": "Liverpool",
    "lat": 53.4,
    "lon": -3
  },
  {
    "id": "GRK",
    "name": "Greenock",
    "lat": 55.96,
    "lon": -4.76
  },
  {
    "id": "INV",
    "name": "Invergordon",
    "lat": 57.69,
    "lon": -4.17
  },
  {
    "id": "SQF",
    "name": "South Queensferry",
    "lat": 56,
    "lon": -3.4
  },
  {
    "id": "EDI",
    "name": "Edinburgh",
    "lat": 55.98,
    "lon": -3.17
  },
  {
    "id": "KIR",
    "name": "Kirkwall",
    "lat": 58.99,
    "lon": -2.96
  },
  {
    "id": "LER",
    "name": "Lerwick",
    "lat": 60.15,
    "lon": -1.15
  },
  {
    "id": "TOR",
    "name": "Torshavn",
    "lat": 62.01,
    "lon": -6.77
  },
  {
    "id": "ROT",
    "name": "Rotterdam",
    "lat": 51.9,
    "lon": 4.45
  },
  {
    "id": "AMS",
    "name": "Amsterdam",
    "lat": 52.38,
    "lon": 4.9
  },
  {
    "id": "POR",
    "name": "Portland England",
    "lat": 50.35,
    "lon": -3.6
  },
  {
    "id": "WAT",
    "name": "Waterford",
    "lat": 52.14,
    "lon": -6.99
  },
  {
    "id": "DUN",
    "name": "Dundee",
    "lat": 56.46,
    "lon": -2.97
  },
  {
    "id": "RHO",
    "name": "Rhodes",
    "lat": 36.45,
    "lon": 28.22
  },
  {
    "id": "HER",
    "name": "Heraklion",
    "lat": 35.34,
    "lon": 25.15
  },
  {
    "id": "CHA",
    "name": "Chania",
    "lat": 35.49,
    "lon": 24.08
  },
  {
    "id": "BOD",
    "name": "Bodrum",
    "lat": 37.04,
    "lon": 27.43
  },
  {
    "id": "IZM",
    "name": "Izmir",
    "lat": 38.44,
    "lon": 27.14
  },
  {
    "id": "SAR",
    "name": "Sarande",
    "lat": 39.88,
    "lon": 20
  },
  {
    "id": "PAT",
    "name": "Patmos",
    "lat": 37.33,
    "lon": 26.55
  },
  {
    "id": "extra-sandnes",
    "name": "sandnes",
    "lat": 58.85,
    "lon": 5.74
  },
  {
    "id": "extra-skjolden",
    "name": "skjolden",
    "lat": 61.49,
    "lon": 7.6
  },
  {
    "id": "extra-brindisi",
    "name": "brindisi",
    "lat": 40.64,
    "lon": 17.94
  },
  {
    "id": "extra-trieste",
    "name": "trieste",
    "lat": 45.65,
    "lon": 13.77
  },
  {
    "id": "extra-skagen",
    "name": "skagen",
    "lat": 57.72,
    "lon": 10.59
  },
  {
    "id": "extra-aarhus",
    "name": "aarhus",
    "lat": 56.15,
    "lon": 10.22
  },
  {
    "id": "extra-kristiansund",
    "name": "kristiansund",
    "lat": 63.11,
    "lon": 7.73
  },
  {
    "id": "extra-savona",
    "name": "savona",
    "lat": 44.31,
    "lon": 8.48
  },
  {
    "id": "extra-olbia",
    "name": "olbia",
    "lat": 40.92,
    "lon": 9.5
  },
  {
    "id": "extra-portoferraio",
    "name": "portoferraio",
    "lat": 42.81,
    "lon": 10.33
  },
  {
    "id": "extra-trapani",
    "name": "trapani",
    "lat": 38.02,
    "lon": 12.51
  },
  {
    "id": "extra-toulon",
    "name": "toulon",
    "lat": 43.1,
    "lon": 5.88
  },
  {
    "id": "extra-malaga",
    "name": "malaga",
    "lat": 36.71,
    "lon": -4.42
  },
  {
    "id": "extra-genoa",
    "name": "genoa",
    "lat": 44.41,
    "lon": 8.91
  },
  {
    "id": "cel-AAR",
    "name": "Aarhus",
    "lat": 56.15,
    "lon": 10.22
  },
  {
    "id": "cel-AGP",
    "name": "Malaga",
    "lat": 36.71,
    "lon": -4.42
  },
  {
    "id": "cel-HYD",
    "name": "Hydra Greece",
    "lat": 37.35,
    "lon": 23.46
  },
  {
    "id": "cel-JCA",
    "name": "Cannes",
    "lat": 43.55,
    "lon": 7.01
  },
  {
    "id": "cel-PTF",
    "name": "Portofino",
    "lat": 44.3,
    "lon": 9.21
  }
];
const catalogue = [...ports, ...additionalPorts];

export function findReviewPort(input) {
  if (!input || typeof input.id !== 'string' || input.id.length > 120) return null;
  const byId = catalogue.find(port => port.id === input.id);
  if (byId) return byId;
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lon)) return null;
  // Provider-specific identifiers may share an already known harbour position.
  return catalogue.find(port => Math.abs(port.lat - input.lat) < .025 && Math.abs(port.lon - input.lon) < .025) || null;
}
