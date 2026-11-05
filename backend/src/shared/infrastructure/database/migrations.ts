export interface Migration {
  name: string;
  statements: string[];
}

const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

/**
 * Migraciones en orden. Nunca edites una migración ya aplicada en producción:
 * agrega una nueva al final.
 */
export const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    statements: [
      `CREATE TABLE IF NOT EXISTS sections (
        id CHAR(36) NOT NULL PRIMARY KEY,
        page VARCHAR(50) NOT NULL,
        section_key VARCHAR(60) NOT NULL,
        title VARCHAR(200) NOT NULL,
        subtitle VARCHAR(300) NULL,
        body TEXT NULL,
        image_url VARCHAR(500) NULL,
        position INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        UNIQUE KEY uq_sections_page_key (page, section_key),
        KEY idx_sections_page_position (page, position)
      ) ${TABLE_OPTIONS}`,
      `CREATE TABLE IF NOT EXISTS section_items (
        id CHAR(36) NOT NULL PRIMARY KEY,
        section_id CHAR(36) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        image_url VARCHAR(500) NULL,
        position INT NOT NULL,
        KEY idx_section_items_section (section_id, position),
        CONSTRAINT fk_section_items_section FOREIGN KEY (section_id)
          REFERENCES sections (id) ON DELETE CASCADE
      ) ${TABLE_OPTIONS}`,
      `CREATE TABLE IF NOT EXISTS worksheets (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        human_value VARCHAR(100) NOT NULL,
        level ENUM('primary', 'secondary') NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_mime VARCHAR(150) NOT NULL,
        file_size INT UNSIGNED NOT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        KEY idx_worksheets_level (level, created_at)
      ) ${TABLE_OPTIONS}`,
      `CREATE TABLE IF NOT EXISTS admin_users (
        id CHAR(36) NOT NULL PRIMARY KEY,
        email VARCHAR(190) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        UNIQUE KEY uq_admin_users_email (email)
      ) ${TABLE_OPTIONS}`,
    ],
  },
  {
    // Diseño elegible por sección, nuevas páginas del menú y cartillas de preescolar.
    name: '002_section_layout_and_preschool',
    statements: [
      `ALTER TABLE sections ADD COLUMN layout VARCHAR(30) NOT NULL DEFAULT 'cards' AFTER image_url`,
      `ALTER TABLE worksheets MODIFY COLUMN level ENUM('preschool', 'primary', 'secondary') NOT NULL`,
    ],
  },
];
