CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(100),
    email VARCHAR(100) NOT NULL
);

INSERT INTO
    users (name, password, email)
VALUES (
        'Justus',
        '1234',
        'NopeNope@Nope.de'
    );