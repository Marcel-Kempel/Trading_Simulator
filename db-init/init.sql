-- Runs ONLY on first init of an empty /var/lib/mysql volume.
-- If your DB volume already exists, run: docker compose down -v

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
);

-- No default user inserted here.
-- Reason: backend uses bcrypt hashes; inserting plaintext would break login.
