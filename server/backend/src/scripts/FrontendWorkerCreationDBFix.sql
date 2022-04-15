CREATE SEQUENCE worker_local_id_seq;
ALTER TABLE worker ALTER local_id SET DEFAULT nextval('worker_local_id_seq');
SELECT setval('worker_local_id_seq', 1);

CREATE OR REPLACE FUNCTION compute_worker_id()
  RETURNS TRIGGER AS $$
  BEGIN
  IF NEW.id IS NULL THEN
  NEW.id = NEW.local_id;
  END IF;
  RETURN NEW;
  END;
  $$ language 'plpgsql';

CREATE TRIGGER worker_id_trigger BEFORE INSERT ON worker FOR EACH ROW EXECUTE PROCEDURE compute_worker_id();