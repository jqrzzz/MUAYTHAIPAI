-- Add photos array to trainer_profiles
ALTER TABLE trainer_profiles
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Update existing trainers to include photo_url in photos array if exists
UPDATE trainer_profiles 
SET photos = ARRAY[photo_url]
WHERE photo_url IS NOT NULL AND photo_url != '' AND (photos IS NULL OR photos = '{}');
