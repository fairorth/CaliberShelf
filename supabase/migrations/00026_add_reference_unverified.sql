-- Agent-supplied reference numbers need human sign-off before downstream
-- agents (price-check valuations, deal matching) should trust them.
-- true = an agent wrote reference_number and no human has confirmed it yet.
-- Cleared when the user edits the reference or clicks "Mark verified".

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS reference_unverified BOOLEAN NOT NULL DEFAULT false;
