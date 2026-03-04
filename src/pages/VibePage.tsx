import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function VibePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { navigate("/"); return; }

    supabase
      .from("vibes")
      .select("latitude, longitude, location")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setLoading(false);
        if (data && data.latitude && data.longitude) {
          sessionStorage.setItem("wk_flyto", JSON.stringify({ lat: data.latitude, lng: data.longitude, name: data.location }));
        }
        navigate("/", { replace: true });
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
