
CREATE TRIGGER on_new_profile_notify
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_signup();
