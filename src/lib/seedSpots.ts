import { supabase } from "@/integrations/supabase/client";

interface SpotData {
  name: string;
  slug: string;
  category: string;
  description: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  rating: number;
  opening_hours: string;
  price_range: string;
  music_style: string | null;
  dress_code: string | null;
  is_partner: boolean;
  has_active_offer: boolean;
  listing_tier: string | null;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function spot(
  name: string,
  category: string,
  description: string,
  address: string,
  neighborhood: string,
  latitude: number,
  longitude: number,
  rating: number,
  opening_hours: string,
  price_range: string,
  music_style: string | null = null,
  dress_code: string | null = null
): SpotData {
  return {
    name,
    slug: toSlug(name),
    category,
    description,
    address,
    neighborhood,
    latitude,
    longitude,
    image_url: null,
    rating,
    opening_hours,
    price_range,
    music_style,
    dress_code,
    is_partner: false,
    has_active_offer: false,
    listing_tier: null,
  };
}

const spots: SpotData[] = [
  // ── ROOFTOPS (15) ──────────────────────────────────────────────
  spot(
    "Le Jardin Secret Rooftop",
    "Rooftop",
    "Perché au-dessus du plus beau jardin caché de la médina, ce rooftop offre une vue imprenable sur l'Atlas et les toits de Marrakech. Un havre de paix où le thé à la menthe prend une toute autre dimension.",
    "121 Rue Mouassine, Médina",
    "Médina",
    31.6315, -7.9870,
    4.5, "09:30–18:00", "€€"
  ),
  spot(
    "Kabana",
    "Rooftop",
    "Le rooftop le plus instagrammable de Marrakech, avec ses poufs colorés et sa vue à 360° sur la médina. Les cocktails sont aussi photogéniques que le décor, et l'ambiance au coucher du soleil est magique.",
    "2 Derb Zaouia, Rahba Lakdima",
    "Médina",
    31.6300, -7.9870,
    4.3, "10:00–23:00", "€€",
    "Chill / Lounge"
  ),
  spot(
    "Café Arabe",
    "Rooftop",
    "Institution de la médina depuis 2000, Café Arabe mélange cuisine italienne et marocaine sur une terrasse ombragée. Le soir venu, les lumières tamisées et la vue sur les minarets créent une atmosphère inoubliable.",
    "184 Rue El Mouassine, Médina",
    "Médina",
    31.6318, -7.9885,
    4.4, "10:00–23:00", "€€€"
  ),
  spot(
    "Nomad",
    "Rooftop",
    "Cuisine marocaine moderne servie sur un rooftop surplombant la place des épices. Nomad est devenu le rendez-vous incontournable des foodies du monde entier qui visitent Marrakech.",
    "1 Derb Aarjane, Rahba Lakdima",
    "Médina",
    31.6298, -7.9862,
    4.6, "12:00–23:00", "€€€"
  ),
  spot(
    "El Fenn",
    "Rooftop",
    "Le rooftop de cet hôtel-boutique légendaire offre une piscine avec vue sur les montagnes de l'Atlas. Un spot exclusif où l'art contemporain rencontre le luxe marocain dans une ambiance décontractée.",
    "2 Derb Moulay Abdullah Ben Hezzian, Bab El Ksour",
    "Médina",
    31.6282, -7.9905,
    4.7, "10:00–00:00", "€€€",
    "Lounge / Deep House"
  ),
  spot(
    "Riad Yima",
    "Rooftop",
    "Le riad pop-art de Hassan Hajjaj transformé en café-galerie déjanté. La terrasse multicolore est un délire visuel où l'on siroite du jus d'orange frais entouré d'œuvres acidulées.",
    "52 Derb Aarjane, Rahba Lakdima",
    "Médina",
    31.6296, -7.9858,
    4.2, "10:00–19:00", "€"
  ),
  spot(
    "Baromètre",
    "Rooftop",
    "Bar à cocktails chic avec une terrasse en hauteur offrant une vue panoramique sur Guéliz. L'endroit parfait pour un afterwork entre amis avec des mixologistes talentueux aux commandes.",
    "Rue Mohammed El Beqal, Guéliz",
    "Guéliz",
    31.6352, -8.0050,
    4.1, "17:00–01:00", "€€",
    "House / Nu-Disco",
    "Smart Casual"
  ),
  spot(
    "La Terrasse des Épices",
    "Rooftop",
    "Cachée au cœur du souk des épices, cette terrasse secrète est un bijou de la médina. On y déguste des tajines revisités avec vue sur les cigognes qui nichent sur les ruines du palais El Badi.",
    "15 Souk Cherifia, Sidi Abdelaziz",
    "Médina",
    31.6290, -7.9855,
    4.3, "10:00–22:30", "€€"
  ),
  spot(
    "Le Salama",
    "Rooftop",
    "Face à la place Jemaa el-Fna, ce rooftop est le balcon parfait pour observer le spectacle de la place mythique. La cuisine marocaine y est raffinée et le panorama absolument spectaculaire.",
    "40 Rue des Banques, Jemaa el-Fna",
    "Médina",
    31.6256, -7.9890,
    4.0, "11:00–23:30", "€€€",
    "Live Gnawa"
  ),
  spot(
    "Dar Cherifa",
    "Rooftop",
    "Le plus ancien riad de la médina reconverti en café littéraire et galerie d'art. La terrasse intimiste offre un moment suspendu hors du temps, entre zelliges anciens et ciel bleu.",
    "8 Derb Chorfa Lakbir, Mouassine",
    "Médina",
    31.6310, -7.9878,
    4.4, "09:00–19:00", "€"
  ),
  spot(
    "Sky Lounge",
    "Rooftop",
    "Au sommet du Renaissance Hotel, ce sky bar offre la vue la plus haute de Marrakech. Cocktails premium et ambiance lounge chic pour des soirées mémorables au-dessus de la ville ocre.",
    "Angle Bd Mohammed V & Bd Zerktouni, Guéliz",
    "Guéliz",
    31.6348, -8.0078,
    4.0, "18:00–01:00", "€€€",
    "Lounge / R&B",
    "Smart Casual"
  ),
  spot(
    "Le Foundouk Terrasse",
    "Rooftop",
    "La terrasse du Foundouk surplombe le quartier Kaat Benahid avec élégance. Cuisine franco-marocaine raffinée, bougies et étoiles pour des dîners romantiques inoubliables.",
    "55 Souk Hal Fassi, Kaat Benahid",
    "Médina",
    31.6325, -7.9840,
    4.5, "12:00–00:00", "€€€"
  ),
  spot(
    "Maison de la Photographie Terrace",
    "Rooftop",
    "Au sommet du musée de la photographie, cette terrasse discrète offre une vue à couper le souffle sur les toits de la médina et la Koutoubia. Thé et pâtisseries marocaines dans un cadre culturel unique.",
    "46 Rue Souk Ahel Fès, Médina",
    "Médina",
    31.6330, -7.9845,
    4.3, "09:30–18:00", "€"
  ),
  spot(
    "SO Lounge",
    "Rooftop",
    "Le rooftop ultra-chic du Sofitel surplombant les jardins et la piscine. Ambiance festive le week-end avec DJs internationaux et une carte de cocktails sophistiquée.",
    "Rue Harroun Errachid, Hivernage",
    "Hivernage",
    31.6220, -8.0100,
    4.2, "19:00–02:00", "€€€",
    "Deep House / Tech House",
    "Chic"
  ),
  spot(
    "Kechmara Rooftop",
    "Rooftop",
    "Le rooftop décontracté de Guéliz, repaire des artistes et créatifs locaux. Brunch le dimanche, expos régulières et une programmation musicale pointue en font un lieu incontournable.",
    "3 Rue de la Liberté, Guéliz",
    "Guéliz",
    31.6355, -8.0085,
    4.1, "08:00–00:00", "€€",
    "Jazz / Electro"
  ),

  // ── RESTAURANTS (20) ───────────────────────────────────────────
  spot(
    "Al Fassia",
    "Restaurant",
    "Tenu exclusivement par des femmes, Al Fassia est une institution de la gastronomie marocaine depuis 1987. Ses tajines et couscous sont considérés parmi les meilleurs de tout le Maroc.",
    "55 Bd Mohammed Zerktouni, Guéliz",
    "Guéliz",
    31.6340, -8.0070,
    4.7, "12:00–14:30, 19:00–23:00", "€€€"
  ),
  spot(
    "La Mamounia Restaurant",
    "Restaurant",
    "Le restaurant gastronomique du palace mythique La Mamounia, où chaque plat est une œuvre d'art. Un voyage culinaire d'exception dans un cadre art déco somptueux et des jardins centenaires.",
    "Avenue Bab Jdid, Médina",
    "Médina",
    31.6225, -7.9960,
    4.8, "19:30–23:00", "€€€"
  ),
  spot(
    "Le Jardin",
    "Restaurant",
    "Niché dans un jardin tropical luxuriant au cœur de la médina, ce restaurant est une oasis de fraîcheur. La cuisine fusion méditerranéenne-marocaine y est servie sous les bananiers et les bougainvilliers.",
    "32 Souk Sidi Abdelaziz, Médina",
    "Médina",
    31.6305, -7.9860,
    4.4, "11:00–23:00", "€€"
  ),
  spot(
    "Chez Chegrouni",
    "Restaurant",
    "Le tajine le plus célèbre de la place Jemaa el-Fna, servi depuis des décennies sur la terrasse au premier étage. Authentique, généreux et abordable — le vrai goût de Marrakech populaire.",
    "Place Jemaa el-Fna, Médina",
    "Médina",
    31.6258, -7.9892,
    4.0, "07:00–23:00", "€"
  ),
  spot(
    "Amal Center",
    "Restaurant",
    "Restaurant solidaire qui forme des femmes en difficulté aux métiers de la restauration. La cuisine marocaine y est généreuse et authentique, et chaque repas contribue à un projet social inspirant.",
    "Rue Allal Ben Ahmed, Guéliz",
    "Guéliz",
    31.6365, -8.0060,
    4.5, "12:00–15:00", "€"
  ),
  spot(
    "La Table du Palais",
    "Restaurant",
    "Haute gastronomie marocaine servie dans le cadre majestueux du Palais Namaskar. Chaque plat est une ode aux saveurs du Maroc, sublimé par un service impeccable et un décor palatial.",
    "Route de Bab Atlas, Palmeraie",
    "Palmeraie",
    31.6650, -8.0200,
    4.6, "19:00–23:00", "€€€"
  ),
  spot(
    "Pepe Nero",
    "Restaurant",
    "Le meilleur italien de Marrakech, installé dans un riad sublimement décoré de la médina. Les pâtes fraîches et les risottos rivaliseraient avec les meilleures tables de Rome.",
    "17 Derb Cherkaoui, Douar Graoua",
    "Médina",
    31.6275, -7.9880,
    4.5, "19:00–23:30", "€€€"
  ),
  spot(
    "SEEN Restaurant",
    "Restaurant",
    "Perché au sixième étage du Radisson Blu, SEEN offre une vue panoramique et une cuisine fusion audacieuse. Le brunch du dimanche est devenu un rituel pour la jeunesse dorée de Marrakech.",
    "Av. Président Kennedy, Hivernage",
    "Hivernage",
    31.6210, -8.0070,
    4.3, "12:00–00:00", "€€€",
    "Lounge / Pop"
  ),
  spot(
    "Café Clock",
    "Restaurant",
    "Café culturel emblématique connu pour son burger au dromadaire et ses soirées storytelling. Un lieu de rencontre entre voyageurs et locaux, avec des ateliers de calligraphie et concerts gnawa.",
    "224 Derb Chtouka, Kasbah",
    "Kasbah",
    31.6195, -7.9870,
    4.4, "09:00–22:00", "€",
    "Gnawa / Live"
  ),
  spot(
    "Latitude 31",
    "Restaurant",
    "Restaurant-lounge trendy au cœur de Guéliz avec une cuisine fusion internationale. La terrasse arborée est parfaite pour un déjeuner décontracté et les soirées tapas du jeudi sont légendaires.",
    "Rue El Mouahidine, Guéliz",
    "Guéliz",
    31.6358, -8.0055,
    4.2, "12:00–00:00", "€€"
  ),
  spot(
    "Kui-Zin",
    "Restaurant",
    "Street food marocaine revisitée dans un cadre contemporain et décontracté. Les mini-tajines, les briouates créatives et les desserts fusion font de Kui-Zin un favori des locaux branchés.",
    "9 Rue el Ksour, Médina",
    "Médina",
    31.6285, -7.9895,
    4.1, "12:00–22:00", "€"
  ),
  spot(
    "Le Foundouk",
    "Restaurant",
    "Ancien fondouk du XVIe siècle transformé en restaurant gastronomique. La cuisine franco-marocaine est servie dans un patio sublime éclairé aux bougies, une expérience culinaire hors du commun.",
    "55 Souk Hal Fassi, Kaat Benahid",
    "Médina",
    31.6326, -7.9842,
    4.6, "12:00–00:00", "€€€"
  ),
  spot(
    "La Trattoria",
    "Restaurant",
    "La Trattoria de Giancarlo, institution italienne de Marrakech depuis plus de 20 ans. Les antipasti, les pâtes maison et l'ambiance romantique en font un classique indémodable.",
    "179 Rue Mohammed El Beqal, Guéliz",
    "Guéliz",
    31.6345, -8.0045,
    4.3, "12:00–14:30, 19:00–23:00", "€€€"
  ),
  spot(
    "Dar Moha",
    "Restaurant",
    "Le chef Moha Fedal propose une cuisine marocaine d'avant-garde au bord de la piscine de son riad. Spectacle de nage synchronisée entre les plats — une soirée unique à Marrakech.",
    "81 Rue Dar El Bacha, Médina",
    "Médina",
    31.6330, -7.9895,
    4.5, "12:00–15:00, 19:30–23:00", "€€€"
  ),
  spot(
    "Le Tanjia",
    "Restaurant",
    "Spécialisé dans la tanjia, le plat emblématique de Marrakech, ce restaurant face à la place Jemaa el-Fna rend hommage à la tradition culinaire marrakchie avec authenticité et générosité.",
    "14 Rue des Banques, Jemaa el-Fna",
    "Médina",
    31.6255, -7.9888,
    4.0, "11:00–23:00", "€€"
  ),
  spot(
    "Naranj",
    "Restaurant",
    "Cuisine libanaise raffinée dans un riad de la médina avec fontaine et orangers. Les mezze sont exceptionnels et le cadre transporte directement à Beyrouth le temps d'un dîner.",
    "84 Rue el Ksour, Médina",
    "Médina",
    31.6280, -7.9898,
    4.4, "12:00–23:00", "€€€"
  ),
  spot(
    "Bo-Zin",
    "Restaurant",
    "Restaurant-lounge exotique au milieu d'un jardin tropical à la sortie de Marrakech. Cuisine thaï-marocaine fusion, lanternes suspendues et piste de danse sous les étoiles — un lieu magique.",
    "Douar Lahna, Route de l'Ourika",
    "Palmeraie",
    31.6050, -7.9650,
    4.3, "20:00–01:00", "€€€",
    "World Music / Lounge",
    "Chic"
  ),
  spot(
    "Le Comptoir Darna",
    "Restaurant",
    "Le rendez-vous mythique de la nuit marrakchie où gastronomie marocaine, spectacle de danse orientale et ambiance festive se mélangent. Impossible de quitter Marrakech sans y avoir dîné.",
    "Av. Echouhada, Hivernage",
    "Hivernage",
    31.6230, -8.0050,
    4.2, "19:30–01:00", "€€€",
    "Oriental / House",
    "Smart Casual"
  ),
  spot(
    "MAMA Restaurant",
    "Restaurant",
    "Cuisine méditerranéenne moderne dans un cadre minimaliste et lumineux à Guéliz. Les bowls, salades et jus detox attirent une clientèle soucieuse de bien manger sans sacrifier le plaisir.",
    "Rue Ibn Aicha, Guéliz",
    "Guéliz",
    31.6360, -8.0040,
    4.1, "09:00–22:00", "€€"
  ),
  spot(
    "Café des Épices",
    "Restaurant",
    "Surplombant la place Rahba Lakdima, cette terrasse animée est l'endroit parfait pour un déjeuner rapide au cœur du souk. Jus frais, salades et sandwiches dans une ambiance conviviale et colorée.",
    "75 Rahba Lakdima, Médina",
    "Médina",
    31.6295, -7.9860,
    4.2, "08:00–22:00", "€"
  ),

  // ── CLUBS & BARS (15) ──────────────────────────────────────────
  spot(
    "Theatro",
    "Club",
    "Le club le plus spectaculaire de Marrakech, installé dans un ancien théâtre avec scène rotative et décor grandiose. Les plus grands DJs internationaux y mixent devant un public cosmopolite et électrique.",
    "Av. Es Saadi, Hivernage",
    "Hivernage",
    31.6218, -8.0090,
    4.3, "23:30–05:00", "€€€",
    "EDM / House / Hip-Hop",
    "Chic"
  ),
  spot(
    "555 Famous Club",
    "Club",
    "Club branché de l'avenue Mohammed V, repaire de la jeunesse dorée marrakchie. Musique urbaine, shots et piste de danse bondée — l'énergie y est contagieuse jusqu'au petit matin.",
    "Av. Mohammed V, Guéliz",
    "Guéliz",
    31.6350, -8.0075,
    3.9, "23:00–05:00", "€€",
    "Hip-Hop / R&B / Afrobeats",
    "Smart Casual"
  ),
  spot(
    "Pacha Marrakech",
    "Club",
    "L'antenne marrakchie du célèbre club d'Ibiza, avec piscine, jardins et plusieurs dance floors. Les pool parties du dimanche et les soirées à thème sont des événements incontournables.",
    "Av. Mohammed VI, Zone Hôtelière de l'Agdal",
    "Hivernage",
    31.6150, -8.0200,
    4.1, "23:00–06:00", "€€€",
    "House / Techno / Disco",
    "Chic"
  ),
  spot(
    "Le Churchill Bar",
    "Bar",
    "Le bar mythique de La Mamounia, inspiré par Winston Churchill qui y séjournait régulièrement. Cocktails d'exception servis dans un décor art déco feutré avec piano live.",
    "Avenue Bab Jdid, La Mamounia",
    "Médina",
    31.6228, -7.9958,
    4.8, "18:00–01:00", "€€€",
    "Jazz / Piano Live",
    "Chic"
  ),
  spot(
    "Babybar",
    "Bar",
    "Bar à cocktails intimiste et branché, caché dans une ruelle de Guéliz. Les cocktails signatures sont créatifs et l'ambiance confidentielle parfaite pour les soirées entre initiés.",
    "Rue de Yougoslavie, Guéliz",
    "Guéliz",
    31.6362, -8.0062,
    4.2, "19:00–02:00", "€€",
    "Nu-Disco / Funk",
    "Casual Chic"
  ),
  spot(
    "Lotus Club",
    "Club",
    "Club select de Marrakech avec terrasse et piste de danse en plein air. La programmation musicale pointue et l'ambiance VIP attirent les noctambules exigeants de la ville ocre.",
    "Av. Mohammed VI, Hivernage",
    "Hivernage",
    31.6200, -8.0120,
    4.0, "23:00–05:00", "€€€",
    "Tech House / Afro House",
    "Chic"
  ),
  spot(
    "So Lounge",
    "Bar",
    "Le bar du Sofitel Marrakech, ambiance lounge sophistiquée avec DJ sets et cocktails premium. Les soirées à thème du vendredi attirent le tout-Marrakech dans un cadre luxueux.",
    "Rue Harroun Errachid, Hivernage",
    "Hivernage",
    31.6222, -8.0098,
    4.2, "19:00–02:00", "€€€",
    "Lounge / Deep House",
    "Smart Casual"
  ),
  spot(
    "Comptoir Darna Bar",
    "Bar",
    "Le bar du mythique Comptoir Darna, où l'on commence la soirée avec des cocktails orientaux avant de se laisser emporter par les danseuses et l'ambiance festive qui monte crescendo.",
    "Av. Echouhada, Hivernage",
    "Hivernage",
    31.6232, -8.0048,
    4.1, "19:00–02:00", "€€€",
    "Oriental / House",
    "Smart Casual"
  ),
  spot(
    "Jad Mahal",
    "Club",
    "Restaurant-club somptueux inspiré de l'esthétique bollywoodienne. Le dîner-spectacle se transforme en soirée dansante vers minuit dans un décor de mille et une nuits extravagant.",
    "10 Rue Harroun Errachid, Hivernage",
    "Hivernage",
    31.6215, -8.0085,
    4.0, "20:00–03:00", "€€€",
    "Oriental / Pop / House",
    "Chic"
  ),
  spot(
    "Montecristo",
    "Bar",
    "Bar-restaurant cubain de Guéliz avec mojitos, cigares et ambiance latino. Les soirées salsa du mercredi et les concerts live font vibrer ce petit coin de La Havane à Marrakech.",
    "20 Rue Ibn Aicha, Guéliz",
    "Guéliz",
    31.6357, -8.0042,
    4.0, "18:00–01:00", "€€",
    "Latino / Salsa / Live"
  ),
  spot(
    "La Mamounia Bar",
    "Bar",
    "Outre le Churchill, La Mamounia abrite un bar à ciel ouvert dans ses jardins légendaires. Siroter un cocktail sous les oliviers centenaires au coucher du soleil est une expérience inoubliable.",
    "Avenue Bab Jdid, La Mamounia",
    "Médina",
    31.6227, -7.9962,
    4.7, "17:00–00:00", "€€€",
    "Ambient / Lounge",
    "Smart Casual"
  ),
  spot(
    "Nikki Beach",
    "Club",
    "Le célèbre beach club international version Marrakech, avec piscine, lits baldaquin et brunch festif. Les pool parties dominicales sont le rendez-vous incontournable de la jet-set marrakchie.",
    "Circuit de la Palmeraie, Palmeraie",
    "Palmeraie",
    31.6700, -8.0150,
    4.2, "11:00–20:00", "€€€",
    "House / Deep House",
    "Beach Chic"
  ),
  spot(
    "Bodega",
    "Bar",
    "Bar à tapas et vins dans l'ambiance chaude de Guéliz. Les planches de charcuterie, les vins marocains et l'atmosphère conviviale en font le spot parfait pour un apéro prolongé.",
    "Rue de la Liberté, Guéliz",
    "Guéliz",
    31.6353, -8.0082,
    3.9, "18:00–01:00", "€€",
    "Funk / Soul"
  ),
  spot(
    "Le Salama Bar",
    "Bar",
    "Le bar à chicha et cocktails du Salama avec vue directe sur Jemaa el-Fna. L'endroit idéal pour siroter un cocktail marocain en regardant le soleil se coucher sur la place mythique.",
    "40 Rue des Banques, Jemaa el-Fna",
    "Médina",
    31.6257, -7.9891,
    3.8, "17:00–00:00", "€€",
    "Chill / Oriental"
  ),
  spot(
    "African Chic",
    "Club",
    "Restaurant-club élégant célébrant la culture africaine dans toute sa diversité. Cuisine panafricaine, concerts live de musique africaine et soirées dansantes dans un décor somptueux.",
    "Rue Oum Errabia, Guéliz",
    "Guéliz",
    31.6368, -8.0058,
    4.1, "20:00–03:00", "€€€",
    "Afrobeats / Afro House",
    "Smart Casual"
  ),

  // ── CAFÉS (15) ─────────────────────────────────────────────────
  spot(
    "Café de France",
    "Café",
    "Le plus ancien café de la place Jemaa el-Fna, institution depuis 1930. On y boit un café noir en observant le ballet incessant des passants, des charmeurs de serpents et des conteurs.",
    "Place Jemaa el-Fna, Médina",
    "Médina",
    31.6260, -7.9895,
    3.8, "06:00–22:00", "€"
  ),
  spot(
    "Grand Café de la Poste",
    "Café",
    "Ancien bureau de poste colonial transformé en café-brasserie chic. Les hauts plafonds, les ventilateurs et le mobilier d'époque vous plongent dans le Marrakech des années 1920.",
    "Bd El Mansour Eddahbi, Guéliz",
    "Guéliz",
    31.6338, -8.0068,
    4.3, "08:00–23:00", "€€"
  ),
  spot(
    "Café Kessabine",
    "Café",
    "Petit café de quartier authentique fréquenté par les artisans du souk. Le thé à la menthe y est préparé à l'ancienne et les msemen du matin sont les meilleurs de la médina.",
    "Souk Kessabine, Médina",
    "Médina",
    31.6305, -7.9850,
    4.0, "07:00–20:00", "€"
  ),
  spot(
    "Atay Café",
    "Café",
    "Café moderne et lumineux spécialisé dans les thés et infusions du monde entier. La carte de pâtisseries maison et l'atmosphère studieuse en font un repaire apprécié des freelances.",
    "62 Rue de la Liberté, Guéliz",
    "Guéliz",
    31.6360, -8.0080,
    4.2, "08:00–22:00", "€€"
  ),
  spot(
    "16 Café",
    "Café",
    "Coffee shop branché de Guéliz servant du café de spécialité et des avocado toasts. Le décor industriel-chic et le wifi rapide attirent les digital nomads et la jeunesse créative de la ville.",
    "Rue Mohammed El Beqal, Guéliz",
    "Guéliz",
    31.6355, -8.0050,
    4.3, "08:00–22:00", "€€"
  ),
  spot(
    "Café Glacier",
    "Café",
    "Installé en terrasse face à la place Jemaa el-Fna, ce café offre un panorama unique sur l'effervescence de la place. Glaces, jus d'orange pressé et spectacle permanent inclus.",
    "Place Jemaa el-Fna, Médina",
    "Médina",
    31.6252, -7.9885,
    3.9, "07:00–23:00", "€"
  ),
  spot(
    "Bakchich Café",
    "Café",
    "Café-cantine populaire et généreux sur la place des Ferblantiers. Les portions sont énormes, les prix mini et l'ambiance décontractée — le spot favori des étudiants et voyageurs malins.",
    "15 Place des Ferblantiers, Médina",
    "Médina",
    31.6220, -7.9855,
    4.0, "09:00–22:00", "€"
  ),
  spot(
    "My Kechmara",
    "Café",
    "Le café-restaurant le plus cool de Guéliz, point de ralliement de la scène artistique locale. Expositions, concerts acoustiques et brunchs copieux dans une ambiance résolument bohème.",
    "3 Rue de la Liberté, Guéliz",
    "Guéliz",
    31.6356, -8.0087,
    4.1, "08:00–00:00", "€€",
    "Jazz / Acoustique"
  ),
  spot(
    "Kawkab Jeux",
    "Café",
    "Café ludique unique à Marrakech avec une bibliothèque de plus de 200 jeux de société. Parfait pour les après-midi en famille ou entre amis autour d'un thé et de parties endiablées.",
    "Rue Sourya, Guéliz",
    "Guéliz",
    31.6342, -8.0065,
    4.2, "10:00–23:00", "€"
  ),
  spot(
    "Mama Afrika Café",
    "Café",
    "Café afro-bohème coloré et chaleureux, décoré d'artisanat africain. Les jus de fruits exotiques, les smoothie bowls et l'ambiance chaleureuse en font un coup de cœur instantané.",
    "Derb Moulay Abdellah, Médina",
    "Médina",
    31.6290, -7.9875,
    4.0, "09:00–21:00", "€"
  ),
  spot(
    "La Buvette",
    "Café",
    "Wine bar et café dans le quartier de Guéliz, idéal pour un verre de vin marocain en terrasse. La carte des vins locaux est impressionnante et l'ambiance apéro très agréable.",
    "Rue de Yougoslavie, Guéliz",
    "Guéliz",
    31.6365, -8.0063,
    4.1, "11:00–23:00", "€€"
  ),
  spot(
    "Café Arabe Médina",
    "Café",
    "L'espace café au rez-de-chaussée du célèbre Café Arabe, parfait pour une pause dans la fraîcheur du patio. Cappuccinos, jus frais et pâtisseries italiennes dans un décor arabo-andalou.",
    "184 Rue El Mouassine, Médina",
    "Médina",
    31.6319, -7.9886,
    4.3, "10:00–23:00", "€€"
  ),
  spot(
    "Henna Café",
    "Café",
    "Café solidaire où l'on peut se faire tatouer au henné traditionnel en sirotant un thé. Les bénéfices financent des projets éducatifs pour les enfants de la médina — un lieu avec du sens.",
    "93 Derb El Cadi, Médina",
    "Médina",
    31.6302, -7.9848,
    4.4, "10:00–19:00", "€"
  ),
  spot(
    "Terrasse Vert",
    "Café",
    "Café-jardin végétarien caché dans les ruelles de la médina. Salades bio, jus détox et gâteaux vegan dans un cadre verdoyant et apaisant, loin du tumulte des souks.",
    "22 Derb Moulay Abdellah, Médina",
    "Médina",
    31.6288, -7.9868,
    4.1, "09:00–18:00", "€"
  ),
  spot(
    "Café du Livre",
    "Café",
    "Café-librairie anglophone de Guéliz, paradis des lecteurs et des amateurs de brunch. Bibliothèque d'échange, wifi et ambiance feutrée pour des après-midi de lecture gourmande.",
    "44 Rue Tariq Ben Ziad, Guéliz",
    "Guéliz",
    31.6348, -8.0058,
    4.2, "09:00–21:00", "€€"
  ),

  // ── RIADS (10) ─────────────────────────────────────────────────
  spot(
    "Riad Yasmine",
    "Riad",
    "Le riad le plus instagrammé de Marrakech avec sa piscine turquoise entourée de zelliges. Chaque chambre est un bijou de décoration maroco-bohème, et le petit-déjeuner sur la terrasse est un rêve.",
    "43 Derb El Arsa, Riad Laarous",
    "Médina",
    31.6310, -7.9905,
    4.6, "Check-in 14:00", "€€€"
  ),
  spot(
    "Riad BE",
    "Riad",
    "Riad design et contemporain au cœur de la médina, alliance parfaite entre minimalisme moderne et artisanat marocain. La piscine chauffée et le spa en font un refuge de luxe intimiste.",
    "21 Derb Sidi Ali Ben Hamdouch, Médina",
    "Médina",
    31.6295, -7.9880,
    4.5, "Check-in 14:00", "€€€"
  ),
  spot(
    "Riad Kheirredine",
    "Riad",
    "Riad palatial avec piscine chauffée et hammam privé, niché dans le quartier de la Kasbah. Le service est digne d'un palace et l'architecture mêle tradition ancestrale et luxe contemporain.",
    "49 Derb Lakhdar Sghir, Kasbah",
    "Kasbah",
    31.6198, -7.9885,
    4.7, "Check-in 15:00", "€€€"
  ),
  spot(
    "Riad L'Orangeraie",
    "Riad",
    "Havre de paix dans le quartier Mouassine, ce riad au charme authentique dispose de suites spacieuses et d'un patio ombragé par des orangers centenaires. L'hospitalité y est légendaire.",
    "61 Rue Sidi El Yamani, Mouassine",
    "Médina",
    31.6320, -7.9892,
    4.6, "Check-in 14:00", "€€€"
  ),
  spot(
    "Riad Kniza",
    "Riad",
    "Riad d'antiquaire où chaque objet raconte une histoire. Les collections d'art islamique, le hammam en tadelakt et la cuisine du chef en font une adresse secrète pour connaisseurs.",
    "34 Derb l'Hotel, Bab Doukala",
    "Médina",
    31.6335, -7.9930,
    4.5, "Check-in 14:00", "€€€"
  ),
  spot(
    "El Fenn Riad",
    "Riad",
    "Hôtel-boutique fondé par Vanessa Branson, galerie d'art vivante avec piscine sur le toit. L'esprit bohème-chic imprègne chaque recoin de ce lieu où l'art et l'hospitalité se confondent.",
    "2 Derb Moulay Abdullah Ben Hezzian",
    "Médina",
    31.6283, -7.9903,
    4.7, "Check-in 15:00", "€€€"
  ),
  spot(
    "Riad Joya",
    "Riad",
    "Boutique-hôtel de luxe avec seulement 7 suites, chacune décorée dans un style unique. Le spa Givenchy et la table d'hôte gastronomique en font une perle rare de la médina.",
    "29 Derb El Hammam, Mouassine",
    "Médina",
    31.6315, -7.9888,
    4.8, "Check-in 15:00", "€€€"
  ),
  spot(
    "Riad 72",
    "Riad",
    "Riad d'architecte italien au design épuré et sophistiqué. Quatre suites seulement, une piscine noire et un sens du détail obsessionnel — l'adresse la plus exclusive de la médina.",
    "72 Derb Arset Awsel, Bab Doukkala",
    "Médina",
    31.6338, -7.9925,
    4.7, "Check-in 14:00", "€€€"
  ),
  spot(
    "La Sultana",
    "Riad",
    "Palace de la Kasbah avec spa, piscine chauffée et vue sur les toits de la médina. Cinq riads historiques réunis en un seul hôtel somptueux, classé monument historique.",
    "403 Rue de la Kasbah, Kasbah",
    "Kasbah",
    31.6190, -7.9875,
    4.8, "Check-in 15:00", "€€€"
  ),
  spot(
    "Riad Dar Anika",
    "Riad",
    "Riad familial au charme discret avec un jardin intérieur luxuriant. L'accueil chaleureux, les cours de cuisine et la terrasse panoramique en font un cocon idéal pour découvrir Marrakech.",
    "56 Derb Jdid, Riad Zitoun El Kdim",
    "Médina",
    31.6240, -7.9865,
    4.4, "Check-in 14:00", "€€"
  ),

  // ── ACTIVITÉS (10) ─────────────────────────────────────────────
  spot(
    "Jardin Majorelle",
    "Activité",
    "Le jardin mythique créé par Jacques Majorelle et restauré par Yves Saint Laurent. Un éden de bleu cobalt, de cactus géants et de bambous bruissants — le lieu le plus emblématique de Marrakech.",
    "Rue Yves Saint Laurent, Guéliz",
    "Guéliz",
    31.6416, -8.0033,
    4.7, "08:00–18:00", "€€"
  ),
  spot(
    "Musée Yves Saint Laurent",
    "Activité",
    "Chef-d'œuvre architectural dédié au créateur qui a tant aimé Marrakech. Les expositions retracent l'œuvre du maître avec une scénographie sublime dans un bâtiment en terre cuite magistral.",
    "Rue Yves Saint Laurent, Guéliz",
    "Guéliz",
    31.6420, -8.0038,
    4.6, "10:00–18:00", "€€"
  ),
  spot(
    "Palais Bahia",
    "Activité",
    "Chef-d'œuvre de l'architecture arabo-andalouse du XIXe siècle avec ses 150 pièces, jardins et fontaines. Les zelliges, les plâtres sculptés et les plafonds en cèdre peint sont à couper le souffle.",
    "5 Rue Riad Zitoun El Jdid, Médina",
    "Médina",
    31.6215, -7.9845,
    4.5, "09:00–17:00", "€"
  ),
  spot(
    "Palais El Badi",
    "Activité",
    "Les ruines majestueuses du palais saadien du XVIe siècle, autrefois considéré comme la merveille du monde musulman. Les cigognes nichent dans ses murs et la vue depuis les remparts est grandiose.",
    "Ksibat Nhass, Kasbah",
    "Kasbah",
    31.6190, -7.9855,
    4.3, "09:00–17:00", "€"
  ),
  spot(
    "Medina Souks Tour",
    "Activité",
    "Visite guidée à travers le labyrinthe des souks de la médina avec un guide local passionné. Des tanneurs aux dinandiers, découvrez les artisans et leurs savoir-faire ancestraux.",
    "Place Jemaa el-Fna, Médina",
    "Médina",
    31.6262, -7.9890,
    4.4, "09:00–17:00", "€€"
  ),
  spot(
    "Quad Palmeraie",
    "Activité",
    "Aventure en quad à travers la palmeraie et les villages berbères aux portes de Marrakech. Deux heures d'adrénaline entre les palmiers, les pistes de terre rouge et les paysages désertiques.",
    "Circuit de la Palmeraie",
    "Palmeraie",
    31.6680, -8.0100,
    4.1, "08:00–18:00", "€€"
  ),
  spot(
    "Hammam de la Rose",
    "Activité",
    "Le hammam le plus élégant de Marrakech, avec des soins au savon noir, gommage au gant kessa et enveloppement au ghassoul. Un rituel de beauté ancestral dans un cadre somptueux.",
    "130 Dar El Bacha, Médina",
    "Médina",
    31.6332, -7.9900,
    4.5, "09:00–20:00", "€€€"
  ),
  spot(
    "Les Bains de Marrakech",
    "Activité",
    "Spa de luxe offrant l'expérience hammam la plus complète de la ville. Massages aux huiles d'argan, bains de lait et rituels orientaux dans un décor de rêve aux mille bougies.",
    "2 Derb Sedra, Bab Agnaou, Kasbah",
    "Kasbah",
    31.6200, -7.9888,
    4.6, "09:00–20:00", "€€€"
  ),
  spot(
    "Cooking Class La Maison Arabe",
    "Activité",
    "Cours de cuisine marocaine dans l'enceinte du mythique hôtel La Maison Arabe. Apprenez à préparer un tajine, un couscous et des pâtisseries sous la houlette de dadas expérimentées.",
    "1 Derb Assehbe, Bab Doukkala",
    "Médina",
    31.6340, -7.9920,
    4.7, "09:00–13:00", "€€€"
  ),
  spot(
    "Hot Air Balloon Atlas",
    "Activité",
    "Vol en montgolfière au-dessus de la palmeraie et des villages berbères au lever du soleil. La vue sur l'Atlas enneigé et la terre ocre en contrebas est un moment de pur émerveillement.",
    "Départ Palmeraie, Marrakech",
    "Palmeraie",
    31.6700, -8.0050,
    4.8, "06:00–08:00", "€€€"
  ),

  // ── SHOPPING (10) ──────────────────────────────────────────────
  spot(
    "Souk Semmarine",
    "Shopping",
    "L'artère principale du souk de Marrakech, couverte de canisses, où se succèdent babouches, lanternes, épices et tapis. Un festival de couleurs, d'odeurs et de négociations passionnées.",
    "Souk Semmarine, Médina",
    "Médina",
    31.6290, -7.9865,
    4.3, "09:00–20:00", "€"
  ),
  spot(
    "Ensemble Artisanal",
    "Shopping",
    "Coopérative d'artisans à prix fixes, idéale pour acheter sans négocier. Tapis, céramiques, maroquinerie et bijoux berbères de qualité dans un cadre organisé et sans pression.",
    "Avenue Mohammed V, Guéliz",
    "Guéliz",
    31.6280, -7.9920,
    4.0, "08:30–19:00", "€€"
  ),
  spot(
    "33 Rue Majorelle",
    "Shopping",
    "Concept store chic près du Jardin Majorelle, vitrine du design marocain contemporain. Décoration, mode, cosmétiques et objets artisanaux revisités avec une touche résolument moderne.",
    "33 Rue Yves Saint Laurent, Guéliz",
    "Guéliz",
    31.6412, -8.0035,
    4.4, "10:00–19:00", "€€€"
  ),
  spot(
    "Kulchi Concept Store",
    "Shopping",
    "Boutique tendance de Guéliz réunissant créateurs marocains et internationaux. Mode, accessoires, déco et beauté dans un espace lumineux au goût impeccable — le shopping intelligent.",
    "Rue de la Liberté, Guéliz",
    "Guéliz",
    31.6358, -8.0078,
    4.3, "10:00–20:00", "€€€"
  ),
  spot(
    "Mustapha Blaoui",
    "Shopping",
    "L'entrepôt légendaire de Mustapha Blaoui, caverne d'Ali Baba sur trois étages. Lustres en fer forgé, poteries, meubles et tissus — le paradis des décorateurs et amoureux d'artisanat.",
    "144 Rue Bab Doukkala, Médina",
    "Médina",
    31.6345, -7.9940,
    4.5, "09:00–18:30", "€€"
  ),
  spot(
    "Beldi Country Club Shop",
    "Shopping",
    "La boutique du Beldi Country Club propose des créations artisanales exclusives. Céramiques, bougies parfumées, linge de maison et objets en cuivre — tout est fait main avec un savoir-faire rare.",
    "Km 6, Route du Barrage, Chrifia",
    "Palmeraie",
    31.5980, -7.9700,
    4.4, "09:00–18:00", "€€€"
  ),
  spot(
    "Max & Jan",
    "Shopping",
    "Boutique-galerie dans un riad sublime de la médina, présentant du mobilier design inspiré du Maroc. Chaque pièce est une œuvre d'art fonctionnelle, entre tradition berbère et design scandinave.",
    "14 Rue Amsefah, Sidi Abdelaziz",
    "Médina",
    31.6308, -7.9855,
    4.5, "10:00–19:00", "€€€"
  ),
  spot(
    "Atelier Moro",
    "Shopping",
    "Atelier de maroquinerie artisanale où l'on peut voir les artisans travailler le cuir. Sacs, ceintures et accessoires en cuir tanné naturellement — du fait-main authentique et éthique.",
    "114 Place Mouassine, Médina",
    "Médina",
    31.6318, -7.9882,
    4.2, "09:30–19:00", "€€"
  ),
  spot(
    "Lalla Concept Store",
    "Shopping",
    "Boutique éco-responsable mettant en avant des créatrices marocaines. Mode éthique, cosmétiques naturels et accessoires artisanaux dans un espace épuré et engagé.",
    "Rue Kennaria, Médina",
    "Médina",
    31.6292, -7.9872,
    4.3, "10:00–19:00", "€€"
  ),
  spot(
    "Côté Bougie",
    "Shopping",
    "Atelier-boutique de bougies artisanales parfumées aux senteurs du Maroc. Rose, fleur d'oranger, ambre et cèdre — chaque bougie est coulée à la main et raconte une histoire olfactive.",
    "67 Derb Moulay Abdelkader, Médina",
    "Médina",
    31.6300, -7.9878,
    4.4, "09:00–18:00", "€€"
  ),

  // ── CULTURE (5) ────────────────────────────────────────────────
  spot(
    "Médersa Ben Youssef",
    "Culture",
    "La plus grande médersa d'Afrique du Nord, chef-d'œuvre de l'architecture islamique du XIVe siècle. Les zelliges, les stucs et les bois sculptés atteignent ici un niveau de perfection absolue.",
    "Kaat Benahid, Médina",
    "Médina",
    31.6335, -7.9845,
    4.8, "09:00–18:00", "€"
  ),
  spot(
    "Musée de Marrakech",
    "Culture",
    "Installé dans le palais Mnebbi du XIXe siècle, ce musée abrite des collections d'art marocain et des expositions temporaires. Le patio central avec son lustre monumental est spectaculaire.",
    "Place Ben Youssef, Médina",
    "Médina",
    31.6332, -7.9850,
    4.2, "09:00–18:30", "€"
  ),
  spot(
    "Dar Si Said",
    "Culture",
    "Musée des Arts et Métiers marocains dans un palais du XIXe siècle. Collections exceptionnelles de tapis, bijoux berbères, portes en cèdre sculptées et armes anciennes du sud marocain.",
    "Derb Si Said, Riad Zitoun El Jdid",
    "Médina",
    31.6225, -7.9850,
    4.3, "09:00–17:00", "€"
  ),
  spot(
    "Maison de la Photographie",
    "Culture",
    "Musée dédié à la photographie marocaine du XIXe et XXe siècle, avec des clichés fascinants du Maroc ancien. La collection retrace un siècle d'histoire à travers des images rares et émouvantes.",
    "46 Rue Souk Ahel Fès, Médina",
    "Médina",
    31.6328, -7.9843,
    4.5, "09:30–18:00", "€"
  ),
  spot(
    "MACMA",
    "Culture",
    "Le Musée d'Art et de Culture de Marrakech, dédié à l'art contemporain marocain et international. Des expositions audacieuses dans un espace muséal moderne au cœur de la ville nouvelle.",
    "Passage Ghandouri, Rue de Yougoslavie, Guéliz",
    "Guéliz",
    31.6363, -8.0065,
    4.1, "10:00–18:00", "€"
  ),
];

export async function seedSpots(): Promise<void> {
  console.log(`🌱 Starting seed: ${spots.length} spots to insert...`);

  const BATCH_SIZE = 25;
  let inserted = 0;

  for (let i = 0; i < spots.length; i += BATCH_SIZE) {
    const batch = spots.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(spots.length / BATCH_SIZE);

    console.log(
      `📦 Inserting batch ${batchNum}/${totalBatches} (${batch.length} spots)...`
    );

    const { data, error } = await supabase
      .from("places")
      .upsert(batch, { onConflict: "slug" })
      .select();

    if (error) {
      console.error(
        `❌ Error in batch ${batchNum}:`,
        error.message
      );
      throw error;
    }

    inserted += data?.length ?? batch.length;
    console.log(
      `✅ Batch ${batchNum} done — ${inserted}/${spots.length} spots inserted`
    );
  }

  console.log(`🎉 Seed complete! ${inserted} spots inserted into "places".`);
}
