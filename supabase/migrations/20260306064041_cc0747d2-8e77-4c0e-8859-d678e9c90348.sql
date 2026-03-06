
CREATE OR REPLACE FUNCTION public.sync_has_active_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_place_id uuid;
  v_has_active boolean;
BEGIN
  -- Determine which place_id to update
  v_place_id := COALESCE(NEW.place_id, OLD.place_id);

  -- Check if any active offer exists for this place
  SELECT EXISTS (
    SELECT 1 FROM vip_offers
    WHERE place_id = v_place_id
      AND is_active = true
      AND (end_time IS NULL OR end_time > now())
  ) INTO v_has_active;

  UPDATE places SET has_active_offer = v_has_active WHERE id = v_place_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_has_active_offer
AFTER INSERT OR UPDATE OR DELETE ON public.vip_offers
FOR EACH ROW
EXECUTE FUNCTION public.sync_has_active_offer();
