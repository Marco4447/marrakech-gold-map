-- Reset all places: no partners, no active offers
UPDATE places SET is_partner = false, has_active_offer = false;

-- Deactivate all partner offers
UPDATE partner_offers SET is_active = false;

-- Deactivate all VIP offers
UPDATE vip_offers SET is_active = false;