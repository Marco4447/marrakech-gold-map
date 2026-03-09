-- Fix Coco Marrakech: move from Guéliz to Médina (Rue Arset Lmaach, near Koutoubia)
UPDATE places SET
  latitude = 31.6240,
  longitude = -7.9890,
  address = 'Rue Arset Lmaach, Médina, Marrakech',
  neighborhood = 'Médina'
WHERE id = '081592db-b7b2-4094-85cf-cf7f5dd5d099';

-- Fix La Pergola: move from Guéliz to Médina (Riad Monceau, near Jemaa El Fna)
UPDATE places SET
  latitude = 31.6258,
  longitude = -7.9893,
  address = '63 Derb Jamaa, Médina, Marrakech',
  neighborhood = 'Médina'
WHERE id = 'd65e1e51-4690-4e67-b14c-d5dfd7d64a51';

-- Fix 555 Famous Club: move to Agdal (Avenue Mohammed VI)
UPDATE places SET
  latitude = 31.6050,
  longitude = -8.0230,
  address = 'Avenue Mohammed VI, Agdal, Marrakech',
  neighborhood = 'Agdal'
WHERE id = 'b7a6c475-166f-44bf-85ca-980674a539aa';