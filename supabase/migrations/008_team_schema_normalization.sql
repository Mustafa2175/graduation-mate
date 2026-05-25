-- supabase/migrations/008_team_schema_normalization.sql

-- Add new normalized columns
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS project_description text,
ADD COLUMN IF NOT EXISTS project_technologies text[],
ADD COLUMN IF NOT EXISTS roles_needed text[];

-- Safely migrate data from looking_for_role JSON text
DO $$
DECLARE
    team_record record;
    parsed_json jsonb;
    tech_array text[];
    roles_array text[];
    tech_elem jsonb;
    role_elem jsonb;
BEGIN
    FOR team_record IN SELECT id, looking_for_role FROM teams WHERE looking_for_role IS NOT NULL AND looking_for_role != '' LOOP
        BEGIN
            -- Try parsing looking_for_role as JSON
            parsed_json := team_record.looking_for_role::jsonb;
            
            -- Extract description
            IF parsed_json ? 'description' THEN
                UPDATE teams SET project_description = parsed_json->>'description' WHERE id = team_record.id;
            END IF;

            -- Extract technologies
            IF parsed_json ? 'technologies' AND jsonb_typeof(parsed_json->'technologies') = 'array' THEN
                tech_array := '{}';
                FOR tech_elem IN SELECT * FROM jsonb_array_elements(parsed_json->'technologies') LOOP
                    tech_array := array_append(tech_array, tech_elem#>>'{}');
                END LOOP;
                UPDATE teams SET project_technologies = tech_array WHERE id = team_record.id;
            END IF;

            -- Extract roles needed
            IF parsed_json ? 'rolesNeeded' AND jsonb_typeof(parsed_json->'rolesNeeded') = 'array' THEN
                roles_array := '{}';
                FOR role_elem IN SELECT * FROM jsonb_array_elements(parsed_json->'rolesNeeded') LOOP
                    roles_array := array_append(roles_array, role_elem#>>'{}');
                END LOOP;
                UPDATE teams SET roles_needed = roles_array WHERE id = team_record.id;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            -- Ignore malformed JSON or errors for a specific row
            RAISE NOTICE 'Skipping migration for team ID % due to malformed JSON', team_record.id;
        END;
    END LOOP;
END;
$$;
