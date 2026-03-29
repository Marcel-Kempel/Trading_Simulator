package com.tradex.controller;

import com.tradex.model.LoginRequest;
import com.tradex.model.RegisterRequest;
import com.tradex.model.User;
import com.tradex.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .filter(user -> user.getPasswort().equals(request.getPasswort()))
                .map(user -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Login erfolgreich",
                        "user", Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail()))))
                .orElse(ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Ungueltige Email oder Passwort")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Email bereits registriert"));
        }
        User saved = userRepository.save(new User(request.getName(), request.getEmail(), request.getPasswort()));
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Registrierung erfolgreich",
                "user", Map.of("id", saved.getId(), "name", saved.getName(), "email", saved.getEmail())));
    }
}
