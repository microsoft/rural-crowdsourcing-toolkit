CREATE OR REPLACE FUNCTION compute_id()
  RETURNS TRIGGER AS $$
  BEGIN
  IF NEW.id IS NOT NULL THEN
  RETURN NEW;
  END IF;
  IF NEW.box_id IS NULL THEN
  NEW.id = 0;
  ELSE
  NEW.id = NEW.box_id;
  END IF;
  NEW.id = (NEW.id << 48) + NEW.local_id;
  RETURN NEW;
  END;
  $$ language 'plpgsql'