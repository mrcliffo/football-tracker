-- Migration 013: Create function to look up users by email
-- This is needed for parent-child linking functionality

-- Create a function that managers can use to find parent users by email
CREATE OR REPLACE FUNCTION public.find_user_by_email(search_email TEXT)
RETURNS TABLE (
  user_id UUID,
  user_role TEXT,
  user_full_name TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow managers to call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'manager'
  ) THEN
    RAISE EXCEPTION 'Only managers can search for users';
  END IF;

  -- Return user info if found and user is a parent
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.role as user_role,
    p.full_name as user_full_name
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE u.email = search_email
  AND p.role = 'parent';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.find_user_by_email IS
'Allows managers to find parent users by email address for linking to players. Security definer function with role check.';
