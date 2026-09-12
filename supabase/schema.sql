-- ==============================================================================
-- PromptVault - Supabase Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    full_prompt TEXT NOT NULL,
    preview TEXT NOT NULL,
    thumbnail_url TEXT,
    video_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
    currency TEXT NOT NULL DEFAULT 'USDT',
    recommended_model TEXT DEFAULT 'Runway Gen-3 / Kling 1.5',
    duration TEXT DEFAULT '5-8 seconds',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    payment_id UUID,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
    currency TEXT NOT NULL DEFAULT 'USDT',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_prompt_paid UNIQUE (user_id, prompt_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    network TEXT NOT NULL DEFAULT 'TRON / TRC20',
    wallet_address TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'failed')),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Foreign Key link back from purchases to payments
ALTER TABLE public.purchases
    ADD CONSTRAINT fk_purchases_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_prompts_published ON public.prompts(is_published);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_prompt ON public.purchases(prompt_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON public.payments(transaction_hash);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user has purchased a prompt
CREATE OR REPLACE FUNCTION public.has_purchased_prompt(prompt_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.purchases
    WHERE user_id = auth.uid()
      AND prompt_id = prompt_uuid
      AND status = 'paid'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Categories RLS Policies
CREATE POLICY "Public categories are viewable by everyone"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage categories"
ON public.categories FOR ALL
USING (public.is_admin());

-- 6. Profiles RLS Policies
CREATE POLICY "Users can view their own profile or admin can view all"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their own profile info (cannot change role)"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- 7. Prompts RLS Policies
-- IMPORTANT: Public view returns published prompts.
-- To protect the full_prompt column from unauthenticated/unpaid clients,
-- client-side requests select only metadata columns, or query the get_prompt_details RPC function.
CREATE POLICY "Anyone can view published prompts metadata"
ON public.prompts FOR SELECT
USING (is_published = true OR public.is_admin());

CREATE POLICY "Only admins can insert prompts"
ON public.prompts FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update prompts"
ON public.prompts FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete prompts"
ON public.prompts FOR DELETE
USING (public.is_admin());

-- 8. Purchases RLS Policies
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create their own pending purchase"
ON public.purchases FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Only admins or server functions can update purchases"
ON public.purchases FOR UPDATE
USING (public.is_admin());

-- 9. Payments RLS Policies
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can record payment transaction hash"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins or verification functions can update payments"
ON public.payments FOR UPDATE
USING (public.is_admin());

-- 10. Secure RPC Function: Get Prompt with Access Check
-- This guarantees the full prompt is NEVER sent to unpaid users
CREATE OR REPLACE FUNCTION public.get_prompt_with_access(prompt_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  p RECORD;
  is_unlocked BOOLEAN := false;
  tx_hash TEXT := NULL;
  paid_date TIMESTAMPTZ := NULL;
BEGIN
  SELECT * INTO p FROM public.prompts WHERE id = prompt_uuid;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check if admin or paid purchase exists
  IF public.is_admin() THEN
    is_unlocked := true;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT true, pay.transaction_hash, pur.created_at
    INTO is_unlocked, tx_hash, paid_date
    FROM public.purchases pur
    LEFT JOIN public.payments pay ON pay.id = pur.payment_id
    WHERE pur.user_id = auth.uid()
      AND pur.prompt_id = prompt_uuid
      AND pur.status = 'paid'
    LIMIT 1;
    
    IF is_unlocked IS NULL THEN
      is_unlocked := false;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'description', p.description,
    'preview', p.preview,
    'full_prompt', CASE WHEN is_unlocked THEN p.full_prompt ELSE NULL END,
    'thumbnail_url', p.thumbnail_url,
    'video_url', p.video_url,
    'category_id', p.category_id,
    'price', p.price,
    'currency', p.currency,
    'recommended_model', p.recommended_model,
    'duration', p.duration,
    'is_published', p.is_published,
    'is_unlocked', is_unlocked,
    'transaction_hash', tx_hash,
    'purchased_at', paid_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger: Auto-create profile upon auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. Seed Default Categories
INSERT INTO public.categories (name) VALUES
  ('Babies'),
  ('Dogs'),
  ('Family'),
  ('Comedy'),
  ('Action'),
  ('Realistic')
ON CONFLICT (name) DO NOTHING;

-- 13. Crypto Wallets Table
CREATE TABLE IF NOT EXISTS public.crypto_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    memo TEXT,
    instructions TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read enabled crypto wallets"
    ON public.crypto_wallets FOR SELECT
    USING (is_enabled = true);

CREATE POLICY "Admins full access to crypto wallets"
    ON public.crypto_wallets FOR ALL
    USING (public.is_admin());

INSERT INTO public.crypto_wallets (symbol, name, network, address, is_default, is_enabled, instructions)
VALUES (
    'USDT',
    'Tether USD',
    'TRON / TRC-20',
    'TJkVdSdjVf92U3bJoqhiqyP1rHyF78RHLB',
    true,
    true,
    'Send exact USDT amount using TRON (TRC-20) network for instant on-chain verification.'
) ON CONFLICT DO NOTHING;
