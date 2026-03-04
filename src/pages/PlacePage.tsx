import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { navigate("/"); return; }

    supabase
      .from("places")
      .select("name, latitude, longitude")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setLoading(false);
        if (data) {
          // Store coords in sessionStorage and redirect to map
          sessionStorage.setItem("wk_flyto", JSON.stringify({ lat: data.latitude, lng: data.longitude, name: data.name, placeId: id }));
          navigate("/", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
