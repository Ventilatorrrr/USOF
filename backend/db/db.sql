CREATE DATABASE IF NOT EXISTS usof;
USE usof;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    email_confirmed TINYINT(1) DEFAULT 0,
    profile_picture VARCHAR(255),
    social_links JSON NULL,
    rating INT DEFAULT 0,
    role ENUM('user','admin') DEFAULT 'user',
    status_users ENUM('online', 'offline') DEFAULT 'offline',
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    email_token VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    author_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_post ENUM('active','inactive') DEFAULT 'active',
    is_locked BOOLEAN DEFAULT 0,
    likes_count INT DEFAULT 0,
    dislikes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_categories (
    post_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY(post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    author_id INT UNSIGNED NOT NULL,
    parent_id INT UNSIGNED DEFAULT NULL,
    content TEXT NOT NULL,
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes_count INT DEFAULT 0,
    dislikes_count INT DEFAULT 0,
    status_comment ENUM('active','inactive') DEFAULT 'active',
    is_locked BOOLEAN DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );


CREATE TABLE IF NOT EXISTS post_likes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comment_likes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comment_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    is_like BOOLEAN NOT NULL,
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_comment_user (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_favorites (
    user_id INT UNSIGNED NOT NULL,
    post_id INT UNSIGNED NOT NULL,
    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    post_id INT UNSIGNED NULL,
    comment_id INT UNSIGNED NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id, comment_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

INSERT IGNORE INTO users (id, login, password, full_name, email, role, email_confirmed)
VALUES
(1, 'admin', '$2b$10$HjZxl9Awvk7Dg.BSUzFd/eodFlxMEUrTpusamz2/ausRTE0AtoSM6', 'Admin User', 'admin@example.com', 'admin', 1),
(2, 'kate', '$2b$10$uZDSoDYmd/oAkWdx6Ngm0Oji2RSAbTg1UcbPtNDAb6hqVJufJ7IaC', 'Kateryna', 'kate@example.com', 'user', 1),
(3, 'dan', '$2b$10$4FkwlwIaVmP8Pyp7dc0ClOHq0jlHAfXv2eFgJ3ARUD3uP59nrkHFy', 'Daniil', 'daniil@example.com', 'user', 1),
(4, 'mariya', '$2b$10$pIrLqC7nO7uukEWC0cLNx.iEfaoGQhfQKyWG6LZAP8KrsT2dpeLia', 'Masha', 'mariya@example.com', 'user', 1),
(5, 'BestDev', '$2b$10$jVpr5kfj7kvY5yOZ2TrAb.srsFqnF7NxPKk.dU62BA3G/CDBpea16', 'Dev', 'dev@example.com', 'user', 1);

INSERT IGNORE INTO categories (id, title, description) VALUES
(1, 'news', 'Latest news and updates'),
(2, 'frontend', 'Posts about frontend development'),
(3, 'backend', 'Posts about backend development'),
(4, 'memes', 'Entertaining memes'),
(5, 'C++', 'All about C++ programming'),
(6, 'Node.js', 'Explore Node.js development'),
(7, 'questions', 'Questions and tips');

INSERT IGNORE INTO posts (id, author_id, title, content)
VALUES
(1, 2, 'Hello World!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ante elit, pharetra sit amet mauris vitae, condimentum mollis libero. Nulla et ex nibh. In egestas eros eget ligula varius, non hendrerit est hendrerit. Vestibulum ut tortor risus. Sed placerat, ipsum at rhoncus sodales, erat diam posuere massa, et auctor lacus urna at elit. Nunc fermentum diam velit, vel efficitur velit aliquet in. Curabitur volutpat nulla leo, eu iaculis sapien ornare in. Ut ultricies elit a ligula gravida, ac interdum libero semper. Suspendisse a congue libero, et aliquam arcu. Pellentesque euismod, tortor eget condimentum mollis, tellus diam ornare diam, eu efficitur leo ante at libero. Maecenas dapibus, turpis in ultrices consectetur, magna ipsum viverra orci, id dignissim leo odio id turpis. Maecenas semper lectus in sem vehicula lacinia. Praesent euismod sem in lorem laoreet feugiat.'),
(2, 3, 'Frontend Trends', 'React, Vue or Angular?'),
(3, 4, 'Backend Best Practices', 'Node.js, Express і MySQL.'),
(4, 5, 'Funny Meme', '¯\\_(ツ)_/¯'),
(5, 2, 'DevOps Pipeline', 'How to set up CI/CD.'),
(6, 1, 'Welcome to USOF!',
'Welcome to USOF, a community created for developers and technology enthusiasts. Here you can ask technical questions and receive high-quality help from other users, share your knowledge in posts and comments, support others with likes and follows, and grow your reputation as an active member of the platform. If you encounter content that is offensive or violates community standards, you can report it to help keep the environment safe and friendly for everyone.'),
(7, 5, 'ES-modules',
'ES Modules provide numerous important advantages that make modern development more efficient. They are supported natively by browsers, which eliminates the need for bundlers in many cases. Their syntax using import and export is more intuitive and readable, and this structure enables better static analysis. As a result, tools can perform tree shaking more effectively. ES Modules also integrate well with TypeScript, which simplifies type-safe development workflows.'),
(8, 2, 'How to implement nested loops in C++?',
'Please tell us briefly about how to create nested loops in C++.');

INSERT IGNORE INTO comments (id, post_id, author_id, content)
VALUES
(1, 1, 3, 'Cool post!'),
(2, 1, 4, 'Thanks for the information'),
(3, 2, 5, 'I love React'),
(4, 3, 2, 'lol kek!'),
(5, 4, 3, 'ha-ha-ha'),
(1, 8, 3, 'Nested loops can be tricky at first! Think of them like a calendar: the outer loop changes the month, and the inner loop changes the day inside that month. Hope that helps!'),
(2, 6, 3, 'Hey! Are there any rules on language here? Can we swear or keep it clean?');

INSERT IGNORE INTO comment_likes (id, comment_id, user_id, is_like) VALUES
(1, 1, 2, true),
(2, 1, 4, false),
(3, 2, 5, true),
(4, 3, 2, true),
(5, 4, 3, true);

INSERT IGNORE INTO post_favorites (user_id, post_id) VALUES
(2, 1),
(3, 2),
(4, 3),
(5, 4),
(2, 5);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(1, 1),
(1, 2);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(2, 2),
(2, 4);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(3, 3),
(3, 5);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(4, 4),
(4, 1);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(5, 5),
(5, 3);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(8, 6),
(8, 8);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(7, 7);

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(6, 7);
