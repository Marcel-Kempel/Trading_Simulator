CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    passwort VARCHAR(100)
);

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