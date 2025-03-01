-- Création de la base de données
CREATE DATABASE IF NOT EXISTS signature_bot;
USE signature_bot;

-- Tables principales visibles dans le diagramme
CREATE TABLE IF NOT EXISTS members (
    member_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    category_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS channels (
    channel_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE IF NOT EXISTS promotions (
    promotion_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Table de liaison visible dans le diagramme
CREATE TABLE IF NOT EXISTS member_promotions (
    member_id VARCHAR(255),
    promotion_id VARCHAR(255),
    PRIMARY KEY (member_id, promotion_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id)
);

-- Table des rôles (Roles)
CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des threads de signature (Signature_Threads)
CREATE TABLE IF NOT EXISTS signature_threads (
    thread_id VARCHAR(255) PRIMARY KEY,
    channel_id VARCHAR(255),
    promotion_id VARCHAR(255),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id),
    FOREIGN KEY (created_by) REFERENCES members(member_id)
);

-- Table des signatures
CREATE TABLE IF NOT EXISTS signatures (
    signature_id VARCHAR(255) PRIMARY KEY,
    thread_id VARCHAR(255),
    student_id VARCHAR(255),
    teacher_id VARCHAR(255),
    status VARCHAR(50), -- 'pending', 'approved', 'rejected'
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES signature_threads(thread_id),
    FOREIGN KEY (student_id) REFERENCES members(member_id),
    FOREIGN KEY (teacher_id) REFERENCES members(member_id)
);

-- Table anti-spam
CREATE TABLE IF NOT EXISTS spam_protection (
    member_id VARCHAR(255),
    thread_id VARCHAR(255),
    last_action TIMESTAMP,
    action_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id, thread_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (thread_id) REFERENCES signature_threads(thread_id)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_signatures_thread ON signatures(thread_id);
CREATE INDEX idx_signatures_student ON signatures(student_id);
CREATE INDEX idx_signatures_teacher ON signatures(teacher_id);
CREATE INDEX idx_member_promotions_promotion ON member_promotions(promotion_id);
CREATE INDEX idx_channels_category ON channels(category_id); 