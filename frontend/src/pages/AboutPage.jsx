// src/pages/AboutPage.jsx
import React from "react";
import "./AboutPage.css";

export default function AboutPage() {
    return (
        <div className="about-page">
            <h1 className="about-title">About Our Service</h1>

            <section className="about-section">
                <h2>Welcome to Q&A Hub</h2>
                <p>
                    Q&A Hub is a platform where users can ask questions, share knowledge, and interact with a
                    community of curious minds. Our mission is to make learning and collaboration simple,
                    engaging, and accessible for everyone.
                </p>
            </section>

            <section className="about-section">
                <h2>Our Features</h2>
                <ul>
                    <li>Ask and answer questions on various topics</li>
                    <li>Follow categories and filter content by your interests</li>
                    <li>Like and comment on posts to engage with the community</li>
                    <li>Personal profile to manage your posts and track activity</li>
                    <li>Search and navigation tools for quick access to content</li>
                    <li>Pagination to browse a large number of posts easily</li>
                </ul>
            </section>

            <section className="about-section">
                <h2>User-Friendly Design</h2>
                <p>
                    Our interface is designed to be intuitive and visually appealing. Whether you are browsing
                    new posts, reading answers, or interacting with comments, everything is structured for
                    smooth and enjoyable navigation.
                </p>
            </section>

            <section className="about-section">
                <h2>Join Our Community</h2>
                <p>
                    Become part of a growing community of learners and experts. Share your knowledge, gain
                    insights, and participate in discussions that matter. Registration is quick and free, and
                    gives you access to personalized features.
                </p>
            </section>

            <section className="about-section">
                <h2>Our Vision</h2>
                <p>
                    We believe in democratizing knowledge. By connecting people with questions and answers,
                    we create a space where learning is collaborative, inclusive, and continuous.
                </p>
            </section>
        </div>
    );
}
