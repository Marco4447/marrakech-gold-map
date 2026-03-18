import { supabase } from "@/integrations/supabase/client";

/**
 * Log an admin action to the audit_logs table.
 * Fire-and-forget: errors are logged to console but don't block the UI.
 */
export async function logAdminAction(params: {
  action: string;
  targetTable: string;
  targetId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_logs" as any).insert({
      admin_user_id: user.id,
      action: params.action,
      target_table: params.targetTable,
      target_id: params.targetId ?? null,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error("[audit] Failed to log action:", err);
  }
}
