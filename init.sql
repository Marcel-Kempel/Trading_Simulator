-- =========================================================
-- Initial Database Setup
-- =========================================================
-- Dieses Skript legt die Users-Tabelle an und fügt
-- Beispiel-Daten ein.
--
-- HINWEIS:
-- Wird nur beim ersten Initialisieren der Datenbank ausgeführt.
-- Bestehende Daten bleiben unverändert.
--
-- Achtung:
-- Testdaten sollten NICHT in Produktionsumgebungen verwendet werden!
-- =========================================================

-- =========================================================
-- TABLE: users
-- =========================================================
-- Felder:
-- - id: Primärschlüssel (auto increment)
-- - name: Name des Benutzers
-- - email: E-Mail-Adresse
-- - passwort: Passwort im Klartext (nur zu Testzwecken!)
-- =========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    passwort VARCHAR(100)
);

-- =========================================================
-- INITIAL DATA (TESTDATEN)
-- =========================================================
-- Fügt zwei Beispielbenutzer ein.
--
-- Diese Daten sind nur für lokale Entwicklung / Tests gedacht.
-- In echten Anwendungen:
-- -> Benutzer nur über Backend registrieren
-- -> Passwörter hashen (z.B. bcrypt)
-- =========================================================
INSERT INTO
    users (name, email, passwort)
VALUES (
        'Jus',
        'Nope@example.com',
        'Test'
    ),
    (
        'Yash',
        'Nopen@example.com',
        'Test2'
    );