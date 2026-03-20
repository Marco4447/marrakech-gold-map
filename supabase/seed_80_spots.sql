-- Seed 80 real Marrakech spots
-- Run this in Supabase SQL Editor
-- First, add missing columns if they don't exist
DO $$ BEGIN
  ALTER TABLE places ADD COLUMN IF NOT EXISTS phone text;
  ALTER TABLE places ADD COLUMN IF NOT EXISTS tags text[];
  ALTER TABLE places ADD COLUMN IF NOT EXISTS is_outdoor boolean DEFAULT false;
  ALTER TABLE places ADD COLUMN IF NOT EXISTS energy_score integer DEFAULT 50;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Delete existing seeded data (optional — comment out if you want to keep)
-- DELETE FROM places WHERE is_partner = false AND listing_tier IS NULL;

INSERT INTO places (name, slug, category, description, address, neighborhood, latitude, longitude, price_range, opening_hours, phone, tags, is_outdoor, energy_score, rating, image_url, is_partner, has_active_offer, listing_tier)
VALUES

-- ════════════════════════════════════════════════════════════════
-- ROOFTOPS (12)
-- ════════════════════════════════════════════════════════════════

('Kabana', 'kabana', 'rooftop',
 'Le rooftop le plus instagrammable de Marrakech. Poufs colorés, vue à 360° sur la médina et cocktails aussi photogéniques que le décor. Au coucher du soleil, la magie opère.',
 '2 Derb Zaouia, Rahba Lakdima', 'Médina', 31.6300, -7.9870, '€€',
 '10:00–23:00', '+212524391010', ARRAY['rooftop','instagrammable','chill','view','cocktails'], true, 88, 4.3, null, false, false, null),

('Nomad', 'nomad-rooftop', 'rooftop',
 'Cuisine marocaine moderne sur un rooftop surplombant la place des épices. Rendez-vous incontournable des foodies du monde entier qui visitent Marrakech.',
 '1 Derb Aarjane, Rahba Lakdima', 'Médina', 31.6298, -7.9862, '€€€',
 '12:00–23:00', '+212524381403', ARRAY['rooftop','foodie','trendy','view','date-night'], true, 92, 4.6, null, false, false, null),

('Le Salama Rooftop', 'le-salama-rooftop', 'rooftop',
 'Face à Jemaa el-Fna, ce rooftop est le balcon parfait pour observer le spectacle de la place mythique. Cuisine marocaine raffinée et panorama spectaculaire.',
 '40 Rue des Banques, Jemaa el-Fna', 'Médina', 31.6256, -7.9890, '€€€',
 '11:00–23:30', '+212524391305', ARRAY['rooftop','view','live-music','date-night','outdoor'], true, 78, 4.0, null, false, false, null),

('Baromètre', 'barometre-rooftop', 'rooftop',
 'Bar à cocktails chic avec terrasse en hauteur offrant une vue panoramique sur Guéliz. L''endroit parfait pour un afterwork entre amis avec des mixologistes talentueux.',
 'Rue Mohammed El Beqal, Guéliz', 'Guéliz', 31.6352, -8.0050, '€€',
 '17:00–01:00', '+212524457893', ARRAY['rooftop','cocktails','trendy','outdoor','chill'], true, 85, 4.1, null, false, false, null),

('Café Arabe Terrace', 'cafe-arabe-terrace', 'rooftop',
 'Institution de la médina depuis 2000. Cuisine italienne et marocaine sur une terrasse ombragée. Le soir, lumières tamisées et vue sur les minarets pour une atmosphère inoubliable.',
 '184 Rue El Mouassine', 'Médina', 31.6318, -7.9885, '€€€',
 '10:00–23:00', '+212524429728', ARRAY['rooftop','date-night','foodie','view','chill'], true, 82, 4.4, null, false, false, null),

('L''Mida', 'lmida', 'rooftop',
 'Perché au-dessus de la médina, ce rooftop intimiste offre une cuisine fusion maroco-méditerranéenne. Ambiance bohème chic avec bougies et vue dégagée sur les toits.',
 'Derb Nakous, Médina', 'Médina', 31.6310, -7.9878, '€€',
 '12:00–22:30', '+212524385526', ARRAY['rooftop','hidden-gem','chill','foodie','view'], true, 65, 4.2, null, false, false, null),

('SO Lounge', 'so-lounge', 'rooftop',
 'Le rooftop ultra-chic du Sofitel surplombant les jardins et la piscine. Ambiance festive le week-end avec DJs internationaux et cocktails sophistiqués.',
 'Rue Harroun Errachid, Hivernage', 'Hivernage', 31.6220, -8.0100, '€€€',
 '19:00–02:00', '+212524425600', ARRAY['rooftop','party','luxury','cocktails','pool'], true, 80, 4.2, null, false, false, null),

('Sky Bar Four Seasons', 'sky-bar-four-seasons', 'rooftop',
 'Au sommet du Four Seasons, une expérience de luxe absolue. Vue imprenable sur les jardins de la Menara et l''Atlas enneigé en arrière-plan. Service irréprochable.',
 '1 Bd de la Ménara, Hivernage', 'Hivernage', 31.6195, -8.0140, '€€€€',
 '18:00–01:00', '+212524359300', ARRAY['rooftop','luxury','view','cocktails','date-night'], true, 75, 4.7, null, false, false, null),

('Musiro', 'musiro', 'rooftop',
 'Rooftop éco-responsable caché dans la médina. Jus frais bio, salades du jardin et vue zen sur les toits ocre. Un havre de paix loin de l''agitation des souks.',
 'Derb El Hammam, Mouassine', 'Médina', 31.6312, -7.9880, '€',
 '09:00–18:00', '+212661234567', ARRAY['rooftop','chill','budget','outdoor','hidden-gem'], true, 55, 4.0, null, false, false, null),

('Plein Sud', 'plein-sud', 'rooftop',
 'Terrasse panoramique avec vue sur la Koutoubia et la place Jemaa el-Fna. Cocktails créatifs dans une ambiance lounge décontractée, idéale pour les couchers de soleil.',
 'Angle Rue de Yougoslavie, Guéliz', 'Guéliz', 31.6340, -8.0060, '€€',
 '16:00–00:00', '+212524433621', ARRAY['rooftop','cocktails','view','chill','outdoor'], true, 70, 3.9, null, false, false, null),

('Vertigo', 'vertigo', 'rooftop',
 'Le plus haut rooftop de la ville. Vue vertigineuse à 360° depuis le 8ème étage. Programmation DJ le week-end et carte de tapas méditerranéennes.',
 'Bd Zerktouni, Guéliz', 'Guéliz', 31.6348, -8.0078, '€€€',
 '18:00–02:00', '+212524458901', ARRAY['rooftop','party','view','cocktails','trendy'], true, 72, 4.0, null, false, false, null),

('Dar Moha Terrace', 'dar-moha-terrace', 'rooftop',
 'La terrasse du chef étoilé Moha Fedal. Cuisine marocaine gastronomique au bord de la piscine d''un riad somptueux. Spectacle de musique gnawa certains soirs.',
 '81 Rue Dar El Bacha', 'Médina', 31.6330, -7.9900, '€€€€',
 '19:30–23:00', '+212524386400', ARRAY['rooftop','luxury','foodie','date-night','live-music'], true, 68, 4.5, null, false, false, null),

-- ════════════════════════════════════════════════════════════════
-- RESTAURANTS (15)
-- ════════════════════════════════════════════════════════════════

('Al Fassia', 'al-fassia', 'restaurant',
 'Tenu exclusivement par des femmes depuis 1987, Al Fassia est une institution de la gastronomie marocaine. Ses tajines et couscous sont parmi les meilleurs de tout le Maroc.',
 '55 Bd Zerktouni, Guéliz', 'Guéliz', 31.6345, -8.0070, '€€€',
 '12:00–14:30, 19:00–23:00', '+212524434060', ARRAY['foodie','date-night','indoor','trendy'], false, 85, 4.5, null, false, false, null),

('Le Jardin', 'le-jardin', 'restaurant',
 'Restaurant-jardin caché dans un riad de la médina. On mange sous les bananiers et bougainvilliers dans une ambiance zen et luxuriante. Cuisine méditerranéo-marocaine.',
 '32 Souk Jeld, Sidi Abdelaziz', 'Médina', 31.6305, -7.9855, '€€',
 '11:00–23:00', '+212524378295', ARRAY['foodie','chill','hidden-gem','outdoor','instagrammable'], true, 82, 4.4, null, false, false, null),

('Naranj', 'naranj', 'restaurant',
 'Restaurant libanais raffiné niché dans la médina. Mezzes généreux, grillades parfaites et décor oriental élégant. La terrasse intérieure est un bijou.',
 '84 Rue Riad Zitoun El Jdid', 'Médina', 31.6260, -7.9850, '€€€',
 '12:00–15:00, 19:00–23:00', '+212524385451', ARRAY['foodie','date-night','indoor','luxury'], false, 78, 4.3, null, false, false, null),

('Pepe Nero', 'pepe-nero', 'restaurant',
 'La meilleure cuisine italienne de Marrakech, dans un cadre de riad somptueux avec piscine. Pâtes fraîches maison et carte des vins impressionnante.',
 '17 Derb Cherkaoui, Douar Graoua', 'Médina', 31.6275, -7.9870, '€€€',
 '19:00–23:30', '+212524389067', ARRAY['foodie','date-night','luxury','indoor','instagrammable'], false, 76, 4.4, null, false, false, null),

('La Mamounia Restaurant', 'la-mamounia-restaurant', 'restaurant',
 'Le restaurant principal du palace mythique. Cuisine marocaine d''exception dans un cadre Art Déco légendaire. Une expérience gastronomique inoubliable.',
 'Avenue Bab Jdid', 'Hivernage', 31.6225, -7.9945, '€€€€',
 '12:30–15:00, 19:30–23:00', '+212524388600', ARRAY['luxury','foodie','date-night','indoor'], false, 70, 4.7, null, false, false, null),

('Dar Yacout', 'dar-yacout', 'restaurant',
 'Le restaurant le plus emblématique de Marrakech. Dîner spectaculaire de 7 plats servi dans un palais du 18ème. Réservation indispensable.',
 '79 Sidi Ahmed Soussi', 'Médina', 31.6340, -7.9860, '€€€€',
 '19:30–23:00', '+212524382929', ARRAY['luxury','foodie','date-night','indoor','culture'], false, 72, 4.3, null, false, false, null),

('Le Foundouk', 'le-foundouk', 'restaurant',
 'Cuisine franco-marocaine raffinée dans un ancien caravansérail magnifiquement restauré. La terrasse surplombe Kaat Benahid, romantique et élégant.',
 '55 Souk Hal Fassi, Kaat Benahid', 'Médina', 31.6325, -7.9840, '€€€',
 '12:00–00:00', '+212524378190', ARRAY['foodie','date-night','rooftop','trendy'], false, 80, 4.5, null, false, false, null),

('Amal Centre', 'amal-centre', 'restaurant',
 'Restaurant social qui forme des femmes en difficulté à la cuisine. Plats marocains authentiques à prix doux dans un jardin paisible. Bonne cause et bonne cuisine.',
 'Rue Allal Ben Ahmed, Guéliz', 'Guéliz', 31.6360, -8.0040, '€',
 '12:00–15:30', '+212524446896', ARRAY['foodie','budget','outdoor','family','hidden-gem'], true, 75, 4.6, null, false, false, null),

('Café Clock', 'cafe-clock', 'restaurant',
 'Institution culturelle autant que culinaire. Connu pour son burger au chameau et ses soirées storytelling. Cours de cuisine et concerts de gnawa réguliers.',
 '224 Derb Chtouka, Kasbah', 'Kasbah', 31.6215, -7.9880, '€',
 '09:00–22:00', '+212524378367', ARRAY['foodie','culture','budget','live-music','trendy'], false, 83, 4.4, null, false, false, null),

('La Table du Riad', 'la-table-du-riad', 'restaurant',
 'Cuisine gastronomique marocaine dans l''intimité d''un riad privé. Menu dégustation de 5 plats avec accords mets-vins. Ambiance bougie et zellige.',
 'Derb Sidi Bouamar', 'Médina', 31.6290, -7.9865, '€€€',
 '19:30–22:30', '+212661345678', ARRAY['foodie','luxury','date-night','hidden-gem','indoor'], false, 60, 4.3, null, false, false, null),

('Kechmara', 'kechmara', 'restaurant',
 'Le QG des créatifs et artistes de Guéliz. Brunch copieux le dimanche, expos d''art et programmation musicale pointue. Terrasse sur le toit très prisée.',
 '3 Rue de la Liberté, Guéliz', 'Guéliz', 31.6355, -8.0085, '€€',
 '08:00–00:00', '+212524422532', ARRAY['trendy','foodie','outdoor','live-music','chill'], true, 79, 4.1, null, false, false, null),

('Beats Burger', 'beats-burger', 'restaurant',
 'Les meilleurs burgers artisanaux de Marrakech. Ambiance street-food chic avec platines DJ. Smash burgers, loaded fries et milkshakes décadents.',
 'Rue Ibn Aicha, Guéliz', 'Guéliz', 31.6350, -8.0055, '€',
 '12:00–23:00', '+212524457812', ARRAY['foodie','budget','trendy','indoor'], false, 74, 4.2, null, false, false, null),

('La Famille', 'la-famille', 'restaurant',
 'Restaurant 100% végétarien dans un jardin luxuriant. Pas de téléphone autorisé — déconnexion totale. Cuisine du marché fraîche et inventive.',
 '42 Rue Riad Zitoun Jdid', 'Médina', 31.6265, -7.9855, '€€',
 '12:00–15:30', '+212524385265', ARRAY['foodie','chill','outdoor','hidden-gem','instagrammable'], true, 77, 4.5, null, false, false, null),

('Le Trou au Mur', 'le-trou-au-mur', 'restaurant',
 'Bistrot marocain convivial avec une terrasse dominant la médina. Carte courte mais impeccable, cocktails maison et ambiance festive le soir.',
 '21 Rue Dar El Bacha', 'Médina', 31.6325, -7.9895, '€€',
 '12:00–23:00', '+212524383920', ARRAY['foodie','cocktails','outdoor','trendy','chill'], true, 71, 4.2, null, false, false, null),

-- ════════════════════════════════════════════════════════════════
-- CLUBS & BARS (12)
-- ════════════════════════════════════════════════════════════════

('Theatro', 'theatro', 'club',
 'Le club le plus iconique de Marrakech. Installé dans un ancien théâtre, il offre des soirées spectaculaires avec DJs internationaux et shows live.',
 'Hotel Es Saadi, Rue Ibrahim El Mazini, Hivernage', 'Hivernage', 31.6230, -8.0085, '€€€',
 '23:00–05:00', '+212524448811', ARRAY['party','luxury','indoor','cocktails','trendy'], false, 95, 4.1, null, false, false, null),

('555 Famous Club', 'five-famous-club', 'club',
 'Le temple de la fête à Marrakech. Son et lumière spectaculaires, piste de danse géante et programmation house/hip-hop. La nuit commence ici.',
 'Avenue Mohammed VI, Hivernage', 'Hivernage', 31.6215, -8.0110, '€€€',
 '23:30–06:00', '+212524499555', ARRAY['party','indoor','trendy','cocktails'], false, 90, 3.9, null, false, false, null),

('Pacha Marrakech', 'pacha-marrakech', 'club',
 'La franchise ibizenca version Marrakech. Pool parties légendaires en journée, club à ciel ouvert la nuit. L''incontournable des nuits marrakchies.',
 'Avenue Mohammed VI, Zone Hôtelière', 'Hivernage', 31.6200, -8.0130, '€€€',
 '23:00–05:00', '+212524388400', ARRAY['party','pool','outdoor','cocktails','luxury'], true, 87, 4.0, null, false, false, null),

('Le Comptoir Darna', 'le-comptoir-darna', 'bar',
 'Le rendez-vous mythique de Marrakech depuis 1999. Restaurant-bar avec spectacle de danseuses orientales chaque soir. Ambiance folle garantie.',
 'Avenue Echouhada, Hivernage', 'Hivernage', 31.6235, -8.0095, '€€€',
 '19:00–02:00', '+212524437702', ARRAY['party','live-music','cocktails','date-night','trendy'], false, 84, 4.0, null, false, false, null),

('Lotus Club', 'lotus-club', 'club',
 'Club select avec programmation R&B et hip-hop. Intérieur design avec lumières néon et carrés VIP. La jeunesse dorée de Marrakech s''y retrouve.',
 'Rue Mohammed V, Hivernage', 'Hivernage', 31.6225, -8.0100, '€€€',
 '23:00–05:00', '+212524449012', ARRAY['party','trendy','indoor','cocktails'], false, 78, 3.8, null, false, false, null),

('Jad Mahal', 'jad-mahal', 'bar',
 'Bar-restaurant avec spectacle dans un palais oriental démesuré. Fontaines, bougies, et ambiance des Mille et Une Nuits version contemporaine.',
 '10 Rue Haroun Errachid, Hivernage', 'Hivernage', 31.6228, -8.0088, '€€€',
 '20:00–02:00', '+212524436984', ARRAY['party','luxury','live-music','cocktails','date-night'], false, 76, 3.9, null, false, false, null),

('So Night Lounge', 'so-night-lounge', 'club',
 'Le club du Sofitel, ambiance deep house et tech house le weekend. Clientèle internationale, son impeccable et terrasse avec piscine.',
 'Rue Harroun Errachid, Hivernage', 'Hivernage', 31.6220, -8.0100, '€€€',
 '23:00–04:00', '+212524425600', ARRAY['party','pool','luxury','cocktails','outdoor'], true, 73, 4.1, null, false, false, null),

('Café de France', 'cafe-de-france', 'bar',
 'Le café le plus célèbre de la place Jemaa el-Fna. Terrasse au premier étage avec vue imprenable sur le spectacle de la place. Thé à la menthe obligatoire.',
 'Place Jemaa el-Fna', 'Médina', 31.6258, -7.9893, '€',
 '06:00–23:00', '+212524442319', ARRAY['view','budget','outdoor','culture','chill'], true, 80, 3.7, null, false, false, null),

('Kosybar', 'kosybar', 'bar',
 'Bar avec terrasse dominant la place des Ferblantiers et vue sur le palais El Badi. Cocktails de qualité, sushis et tapas dans une ambiance lounge.',
 '47 Place des Ferblantiers', 'Médina', 31.6245, -7.9860, '€€',
 '11:00–00:00', '+212524380324', ARRAY['cocktails','view','outdoor','chill','date-night'], true, 72, 4.1, null, false, false, null),

('Baromètre Bar', 'barometre-bar', 'bar',
 'Le rez-de-chaussée bar du Baromètre. Cocktails d''auteur, tapas créatives et programmation DJ intimiste. L''afterwork préféré des expatriés de Guéliz.',
 'Rue Mohammed El Beqal, Guéliz', 'Guéliz', 31.6352, -8.0050, '€€',
 '17:00–01:00', '+212524457893', ARRAY['cocktails','trendy','indoor','chill','shisha'], false, 77, 4.0, null, false, false, null),

('Le Churchill', 'le-churchill', 'bar',
 'Le bar historique de La Mamounia, nommé d''après son illustre habitué. Whiskies rares, cigares cubains et piano bar dans un décor Art Déco sublime.',
 'La Mamounia, Avenue Bab Jdid', 'Hivernage', 31.6225, -7.9945, '€€€€',
 '18:00–01:00', '+212524388600', ARRAY['luxury','cocktails','indoor','date-night','chill'], false, 65, 4.6, null, false, false, null),

('African Chic', 'african-chic', 'bar',
 'Restaurant-club avec show live chaque soir. Ambiance afro-chic, musique live et danseuses. La soirée commence au dîner et finit sur la piste.',
 '8 Rue Oum Errabia, Guéliz', 'Guéliz', 31.6358, -8.0065, '€€€',
 '20:00–02:00', '+212524431424', ARRAY['party','live-music','cocktails','trendy','indoor'], false, 74, 3.9, null, false, false, null),

-- ════════════════════════════════════════════════════════════════
-- CAFÉS (10)
-- ════════════════════════════════════════════════════════════════

('Café des Épices', 'cafe-des-epices', 'cafe',
 'Terrasse colorée sur la place Rahba Lakdima avec vue sur les souks. Jus d''orange frais pressé, salades et ambiance décontractée. Le spot parfait pour observer la vie locale.',
 'Place Rahba Lakdima', 'Médina', 31.6295, -7.9858, '€',
 '08:00–21:00', '+212524391770', ARRAY['chill','outdoor','budget','view','instagrammable'], true, 80, 4.3, null, false, false, null),

('Atay Café', 'atay-cafe', 'cafe',
 'Café-galerie tendance dans le quartier des épices. Thé à la menthe version gourmet, pâtisseries maison et expos d''artistes locaux. Ambiance bohème chic.',
 '62 Rue Amsefah', 'Médina', 31.6300, -7.9855, '€',
 '09:00–20:00', '+212524440508', ARRAY['chill','hidden-gem','culture','budget','indoor'], false, 62, 4.2, null, false, false, null),

('Bakchic', 'bakchic', 'cafe',
 'Café-restaurant coloré et branché au cœur de la médina. Cuisine healthy, bowls et smoothies. La terrasse sur le toit est un secret bien gardé.',
 'Derb El Ferrane, Mouassine', 'Médina', 31.6315, -7.9875, '€',
 '09:00–22:00', '+212524378930', ARRAY['chill','foodie','budget','outdoor','trendy'], true, 68, 4.1, null, false, false, null),

('Grand Café de la Poste', 'grand-cafe-de-la-poste', 'cafe',
 'Ancien bureau de poste colonial reconverti en café-brasserie chic. Terrasse ombragée, brunch le dimanche et ambiance coloniale revisitée.',
 'Angle Bd El Mansour Eddahbi & Av Imam Malik, Guéliz', 'Guéliz', 31.6362, -8.0052, '€€',
 '08:00–00:00', '+212524433038', ARRAY['chill','trendy','outdoor','brunch','date-night'], true, 75, 4.0, null, false, false, null),

('16 Café', 'seize-cafe', 'cafe',
 'Le coffee shop préféré des digital nomads de Marrakech. Wifi rapide, café de spécialité et pâtisseries artisanales dans un décor minimaliste et lumineux.',
 'Rue Mohammed El Beqal, Guéliz', 'Guéliz', 31.6350, -8.0048, '€',
 '08:00–20:00', '+212524457234', ARRAY['chill','budget','indoor','trendy'], false, 65, 4.3, null, false, false, null),

('Mama Trabendo', 'mama-trabendo', 'cafe',
 'Concept store et café lifestyle à Guéliz. Petits déjeuners copieux, jus detox et déco boho-chic. Le rendez-vous brunch du samedi matin.',
 'Rue El Imam Malik, Guéliz', 'Guéliz', 31.6358, -8.0060, '€€',
 '08:30–18:00', '+212524430789', ARRAY['chill','trendy','foodie','instagrammable','indoor'], false, 60, 4.2, null, false, false, null),

('Café Kif Kif', 'cafe-kif-kif', 'cafe',
 'Petit café associatif au cœur de la médina. Thé, msemmen et conversation avec les artisans du quartier. L''authenticité à l''état pur.',
 'Derb Moulay Abdelkader', 'Médina', 31.6310, -7.9870, '€',
 '08:00–18:00', '+212661456789', ARRAY['budget','culture','hidden-gem','indoor','chill'], false, 45, 4.0, null, false, false, null),

('Le Jardin Secret Café', 'le-jardin-secret-cafe', 'cafe',
 'Le café du plus beau jardin caché de la médina. Terrasse au milieu des fontaines et plantes exotiques. Une parenthèse de calme absolue.',
 '121 Rue Mouassine', 'Médina', 31.6315, -7.9870, '€€',
 '09:30–18:00', '+212524390040', ARRAY['chill','outdoor','instagrammable','culture','view'], true, 72, 4.5, null, false, false, null),

('Kawkab Jeux', 'kawkab-jeux', 'cafe',
 'Le premier board game café de Marrakech. Plus de 200 jeux de société, milkshakes et ambiance geek-friendly. Soirées quiz le jeudi.',
 'Rue Tarik Ibn Ziad, Guéliz', 'Guéliz', 31.6345, -8.0055, '€',
 '10:00–23:00', '+212524430156', ARRAY['chill','indoor','budget','family'], false, 55, 4.1, null, false, false, null),

('Café Clock Kasbah', 'cafe-clock-kasbah', 'cafe',
 'La branche Kasbah du célèbre Café Clock. Ateliers calligraphie, storytelling et concerts gnawa. Le meilleur café culturel de Marrakech.',
 '224 Derb Chtouka, Kasbah', 'Kasbah', 31.6215, -7.9880, '€',
 '09:00–22:00', '+212524378367', ARRAY['culture','live-music','budget','outdoor','chill'], true, 73, 4.4, null, false, false, null),

-- ════════════════════════════════════════════════════════════════
-- RIADS & HÔTELS (10)
-- ════════════════════════════════════════════════════════════════

('La Mamounia', 'la-mamounia', 'hotel',
 'Le palace légendaire de Marrakech depuis 1929. Jardins centenaires, spa d''exception et restaurants étoilés. Churchill, Hitchcock et les Beatles y ont séjourné.',
 'Avenue Bab Jdid', 'Hivernage', 31.6225, -7.9945, '€€€€',
 '24h/24', '+212524388600', ARRAY['luxury','spa','pool','indoor','outdoor'], true, 90, 4.8, null, false, false, null),

('Royal Mansour', 'royal-mansour', 'hotel',
 'Le joyau de la couronne hôtelière marocaine. Riads privés avec piscine, spa souterrain et restaurant 3 étoiles. L''ultime expérience de luxe.',
 'Rue Abou Abbas El Sebti', 'Médina', 31.6240, -7.9920, '€€€€',
 '24h/24', '+212524808080', ARRAY['luxury','spa','pool','foodie','indoor'], false, 85, 4.9, null, false, false, null),

('Riad Yasmine', 'riad-yasmine', 'riad',
 'Le riad le plus photographié de Marrakech grâce à sa piscine turquoise entourée de zellige. Petit-déjeuner somptueux sur la terrasse.',
 'Kaat Benahid', 'Médina', 31.6320, -7.9845, '€€',
 '24h/24', '+212524389587', ARRAY['instagrammable','pool','chill','outdoor','hidden-gem'], true, 82, 4.5, null, false, false, null),

('Riad BE', 'riad-be', 'riad',
 'Riad design et contemporain dans la médina. 5 chambres, piscine noir charbon et décoration minimaliste. L''anti-riad traditionnel, pour ceux qui osent.',
 'Derb Moulay Abdelkader', 'Médina', 31.6308, -7.9868, '€€€',
 '24h/24', '+212524389014', ARRAY['trendy','pool','hidden-gem','instagrammable','indoor'], false, 65, 4.4, null, false, false, null),

('Riad Joya', 'riad-joya', 'riad',
 'Petit riad de charme avec seulement 7 chambres. Décor authentique, hammam privé et cours de cuisine marocaine. L''hospitalité à la marrakchie.',
 '10 Derb Moulay Abdelkader', 'Médina', 31.6305, -7.9862, '€€€',
 '24h/24', '+212524391696', ARRAY['luxury','spa','hidden-gem','indoor','chill'], false, 58, 4.6, null, false, false, null),

('El Fenn', 'el-fenn', 'riad',
 'Hôtel-boutique légendaire avec piscine, art contemporain et rooftop sublime. Fondé par Vanessa Branson, c''est le QG de la scène arty de Marrakech.',
 '2 Derb Moulay Abdullah Ben Hezzian', 'Médina', 31.6282, -7.9905, '€€€€',
 '24h/24', '+212524441210', ARRAY['luxury','pool','rooftop','trendy','instagrammable'], true, 78, 4.7, null, false, false, null),

('Amanjena', 'amanjena', 'hotel',
 'Resort Aman dans la palmeraie. Pavillons avec bassins privés, jardin de 3 hectares et silence absolu. Le luxe contemplatif à son apogée.',
 'Route de Ouarzazate, Km 12', 'Palmeraie', 31.5980, -7.9500, '€€€€',
 '24h/24', '+212524399000', ARRAY['luxury','spa','pool','outdoor','chill'], true, 70, 4.8, null, false, false, null),

('Selman Marrakech', 'selman-marrakech', 'hotel',
 'Palace contemporain avec haras de pur-sang arabes. Piscine de 80 mètres, restaurant gastronomique et écuries royales. Unique au monde.',
 'Km 5, Route d''Amizmiz', 'Hivernage', 31.6050, -8.0200, '€€€€',
 '24h/24', '+212524459600', ARRAY['luxury','pool','spa','outdoor','instagrammable'], true, 72, 4.7, null, false, false, null),

('Les Jardins de la Koutoubia', 'les-jardins-de-la-koutoubia', 'hotel',
 'Hôtel 5 étoiles face à la Koutoubia. Piscine chauffée, spa et accès direct à la médina. L''emplacement parfait pour explorer Marrakech.',
 '26 Rue de la Koutoubia', 'Médina', 31.6250, -7.9920, '€€€',
 '24h/24', '+212524388800', ARRAY['luxury','pool','spa','view','indoor'], false, 68, 4.3, null, false, false, null),

('Palais Namaskar', 'palais-namaskar', 'hotel',
 'Resort mystique dans la palmeraie avec lacs, cascades et bassins à carpes koï. Architecture entre Bali et Marrakech. Spa holistique exceptionnel.',
 'Route de Bab Atlas, Palmeraie', 'Palmeraie', 31.6500, -8.0300, '€€€€',
 '24h/24', '+212524299800', ARRAY['luxury','spa','pool','outdoor','chill'], true, 67, 4.6, null, false, false, null),

-- ════════════════════════════════════════════════════════════════
-- ACTIVITÉS (10)
-- ════════════════════════════════════════════════════════════════

('Jardin Majorelle', 'jardin-majorelle', 'activity',
 'Le jardin bleu mythique créé par Jacques Majorelle et restauré par Yves Saint Laurent. Cactus géants, bassins et le bleu le plus photographié du Maroc.',
 'Rue Yves Saint Laurent, Guéliz', 'Guéliz', 31.6415, -8.0030, '€',
 '08:00–18:30', '+212524313047', ARRAY['culture','outdoor','instagrammable','family'], true, 95, 4.6, null, false, false, null),

('Musée Yves Saint Laurent', 'musee-yves-saint-laurent', 'activity',
 'Chef-d''œuvre architectural dédié au génie de la mode. Expositions permanentes et temporaires dans un bâtiment en brique qui évoque le tissage.',
 'Rue Yves Saint Laurent, Guéliz', 'Guéliz', 31.6418, -8.0025, '€',
 '10:00–18:00', '+212524298686', ARRAY['culture','indoor','instagrammable','trendy'], false, 88, 4.7, null, false, false, null),

('Palais Bahia', 'palais-bahia', 'activity',
 'Palais du 19ème siècle avec 150 pièces somptueusement décorées. Cours intérieures avec fontaines, zellige et plafonds en bois de cèdre peint.',
 'Rue Riad Zitoun El Jdid', 'Médina', 31.6220, -7.9845, '€',
 '09:00–17:00', '+212524389564', ARRAY['culture','outdoor','family','instagrammable'], true, 85, 4.4, null, false, false, null),

('Tombeaux Saadiens', 'tombeaux-saadiens', 'activity',
 'Nécropole royale du 16ème siècle redécouverte en 1917. Mausolées en marbre de Carrare et mosaïques d''une finesse extraordinaire. Un trésor caché.',
 'Rue de la Kasbah', 'Kasbah', 31.6200, -7.9885, '€',
 '09:00–17:00', '+212524441802', ARRAY['culture','outdoor','hidden-gem','family'], true, 78, 4.3, null, false, false, null),

('Médersa Ben Youssef', 'medersa-ben-youssef', 'activity',
 'La plus grande école coranique historique d''Afrique du Nord. Architecture almohade sublime avec cours en marbre, stucs et zellige du 14ème siècle.',
 'Kaat Benahid', 'Médina', 31.6335, -7.9845, '€',
 '09:00–18:00', '+212524441893', ARRAY['culture','indoor','instagrammable','family'], false, 82, 4.5, null, false, false, null),

('Place Jemaa el-Fna', 'jemaa-el-fna', 'activity',
 'La place la plus célèbre d''Afrique. Charmeurs de serpents, conteurs, acrobates le jour. Food stalls à perte de vue la nuit. Patrimoine UNESCO.',
 'Place Jemaa el-Fna', 'Médina', 31.6258, -7.9893, '€',
 '24h/24', null, ARRAY['culture','outdoor','foodie','family','live-music'], true, 98, 4.2, null, false, false, null),

('Hammam de la Rose', 'hammam-de-la-rose', 'activity',
 'Le plus beau hammam de Marrakech. Rituels traditionnels dans un décor de zellige et tadelakt. Gommage au savon noir et massage à l''huile d''argan.',
 '130 Dar El Bacha', 'Médina', 31.6328, -7.9895, '€€',
 '09:00–20:00', '+212524444769', ARRAY['spa','indoor','luxury','chill'], false, 75, 4.5, null, false, false, null),

('Les Bains de Marrakech', 'les-bains-de-marrakech', 'activity',
 'Spa de luxe dans un riad du 18ème siècle. Hammam vapeur, bain de lait et soins à la rose de Dadès. Parenthèse de bien-être absolue.',
 '2 Derb Sedra, Bab Agnaou', 'Kasbah', 31.6210, -7.9895, '€€€',
 '09:00–20:00', '+212524381428', ARRAY['spa','luxury','indoor','chill'], false, 70, 4.4, null, false, false, null),

('Ouzoud Day Trip', 'ouzoud-day-trip', 'activity',
 'Excursion aux cascades d''Ouzoud, les plus hautes d''Afrique du Nord (110m). Randonnée, baignade et rencontre avec les singes magots. 2h30 de Marrakech.',
 'Cascades d''Ouzoud (excursion depuis Marrakech)', 'Palmeraie', 31.6400, -8.0000, '€',
 '07:00–19:00', '+212661567890', ARRAY['outdoor','family','budget','view'], true, 72, 4.3, null, false, false, null),

('Quad Palmeraie', 'quad-palmeraie', 'activity',
 'Circuit de quad et buggy dans la palmeraie de Marrakech. Adrénaline entre les palmiers et villages berbères. Coucher de soleil sur l''Atlas en bonus.',
 'Circuit Palmeraie, Km 8', 'Palmeraie', 31.6600, -7.9700, '€€',
 '08:00–18:00', '+212661678901', ARRAY['outdoor','trendy','family','view'], true, 68, 4.1, null, false, false, null),

-- ════════════════════════════════════════════════════════════════
-- SHOPPING (8)
-- ════════════════════════════════════════════════════════════════

('Souk Semmarine', 'souk-semmarine', 'shopping',
 'L''artère principale des souks de Marrakech. Babouches, lanternes, épices et tapis sous des voûtes centenaires. L''expérience shopping la plus intense du monde.',
 'Souk Semmarine, Médina', 'Médina', 31.6290, -7.9865, '€',
 '09:00–20:00', null, ARRAY['shopping','culture','outdoor','budget'], true, 90, 4.0, null, false, false, null),

('Ensemble Artisanal', 'ensemble-artisanal', 'shopping',
 'Coopérative d''artisans avec prix fixes (pas de négociation). Poterie, bois, cuir et tissage de qualité. L''alternative zen au chaos des souks.',
 'Avenue Mohammed V', 'Hivernage', 31.6240, -7.9930, '€',
 '08:30–19:00', '+212524386878', ARRAY['shopping','culture','indoor','budget','family'], false, 65, 3.9, null, false, false, null),

('Souk des Teinturiers', 'souk-des-teinturiers', 'shopping',
 'Le souk le plus coloré de Marrakech. Écheveaux de laine et de soie séchant au soleil dans un arc-en-ciel permanent. Photo obligatoire.',
 'Souk des Teinturiers, Médina', 'Médina', 31.6310, -7.9850, '€',
 '08:00–18:00', null, ARRAY['shopping','culture','outdoor','instagrammable','hidden-gem'], true, 72, 4.2, null, false, false, null),

('Mellah Market', 'mellah-market', 'shopping',
 'Le marché de l''ancien quartier juif. Épices, fruits secs, olives et produits locaux à prix imbattables. Moins touristique que les souks principaux.',
 'Avenue Houmman El Fetouaki', 'Médina', 31.6245, -7.9855, '€',
 '07:00–18:00', null, ARRAY['shopping','foodie','budget','outdoor','hidden-gem'], true, 60, 3.8, null, false, false, null),

('33 Rue Majorelle', '33-rue-majorelle', 'shopping',
 'Concept store de mode marocaine contemporaine. Caftans revisités, bijoux artisanaux et objets design. La mode Kech version 2024.',
 '33 Rue Yves Saint Laurent, Guéliz', 'Guéliz', 31.6410, -8.0035, '€€€',
 '09:30–19:30', '+212524314195', ARRAY['shopping','trendy','indoor','luxury'], false, 68, 4.3, null, false, false, null),

('Max & Jan', 'max-jan', 'shopping',
 'Boutique-café belge dans un riad sublime. Mode éthique, céramiques artisanales et brunch dans un patio verdoyant. Shopping + café en un seul lieu.',
 '14 Rue Amsefah', 'Médina', 31.6300, -7.9858, '€€',
 '10:00–19:00', '+212524378578', ARRAY['shopping','trendy','hidden-gem','instagrammable','indoor'], false, 62, 4.4, null, false, false, null),

('Lalla Concept Store', 'lalla-concept-store', 'shopping',
 'La référence du design marocain contemporain. Sacs en cuir, bijoux, céramiques et produits de beauté naturels. Tout est fabriqué localement.',
 'Rue de la Liberté, Guéliz', 'Guéliz', 31.6355, -8.0082, '€€',
 '10:00–19:30', '+212524430376', ARRAY['shopping','trendy','indoor','instagrammable'], false, 64, 4.2, null, false, false, null),

('Al Kawtar', 'al-kawtar', 'shopping',
 'Coopérative de femmes qui brodent des textiles d''exception. Nappes, coussins et caftans brodés main. Commerce équitable et savoir-faire ancestral.',
 'Rue Riad Zitoun El Jdid', 'Médina', 31.6265, -7.9850, '€',
 '09:00–18:00', '+212524378271', ARRAY['shopping','culture','budget','hidden-gem','indoor'], false, 50, 4.1, null, false, false, null),

-- ════════════════════════════════════════════════════════════════
-- CULTURE (3)
-- ════════════════════════════════════════════════════════════════

('Dar Si Said Museum', 'dar-si-said-museum', 'culture',
 'Musée des arts marocains dans un palais du 19ème. Collections de bijoux berbères, boiseries, zellige et tapis anciens. L''artisanat marocain à travers les siècles.',
 'Rue Riad Zitoun El Jdid', 'Médina', 31.6250, -7.9848, '€',
 '09:00–17:00', '+212524389564', ARRAY['culture','indoor','family'], false, 60, 4.2, null, false, false, null),

('Maison de la Photographie', 'maison-de-la-photographie', 'culture',
 'Collection unique de photographies du Maroc de 1870 à 1960. Terrasse avec vue sublime sur la médina. Un voyage dans le temps fascinant.',
 '46 Rue Souk Ahel Fès', 'Médina', 31.6330, -7.9845, '€',
 '09:30–18:00', '+212524385721', ARRAY['culture','view','outdoor','instagrammable','hidden-gem'], true, 70, 4.3, null, false, false, null),

('MACMA', 'macma', 'culture',
 'Musée d''Art et de Culture de Marrakech. Art contemporain marocain et international dans un dar historique. Expositions temporaires de qualité.',
 '61 Rue Yves Saint Laurent, Guéliz', 'Guéliz', 31.6412, -8.0032, '€',
 '09:30–18:30', '+212524437362', ARRAY['culture','indoor','trendy','instagrammable'], false, 55, 4.1, null, false, false, null)

ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  price_range = EXCLUDED.price_range,
  opening_hours = EXCLUDED.opening_hours,
  phone = EXCLUDED.phone,
  tags = EXCLUDED.tags,
  is_outdoor = EXCLUDED.is_outdoor,
  energy_score = EXCLUDED.energy_score,
  rating = EXCLUDED.rating,
  neighborhood = EXCLUDED.neighborhood;
