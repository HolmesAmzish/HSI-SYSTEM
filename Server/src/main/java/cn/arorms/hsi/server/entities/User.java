package cn.arorms.hsi.server.entities;

import jakarta.persistence.*;
import lombok.Data;

/**
 * User entity for authentication and authorization.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username = "";

    private String email = "";

    private String password = "";
}