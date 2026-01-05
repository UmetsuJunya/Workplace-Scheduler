-- Convert all existing email addresses to lowercase
UPDATE "users"
SET email = LOWER(email)
WHERE email IS NOT NULL;
