import React from 'react';
import "./Footer.css";

import appLogoFooter from "../assets/images/logo/app-logo-footer.png";
import githubIcon from "../assets/images/social-networks/github-icon.png";
import linkedinIcon from "../assets/images/social-networks/linkedin-icon.png";
import telegramIcon from "../assets/images/social-networks/telegram-icon.png";
import instagramIcon from "../assets/images/social-networks/instagram-icon.png";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">

                <div className="footer-section">

                    <img src={appLogoFooter} alt="Logo" className="logo" />
                    <p className="footer-tagline">A service for sharing knowledge and questions</p>
                    <div className="social-links">
                        <a href="https://github.com/Ventilatorrrr" target="_blank" rel="noopener noreferrer">
                            <img src={githubIcon} alt="github-icon" className="icon-img" />
                        </a>
                        <a href="https://x.com/yourhandle" target="_blank" rel="noopener noreferrer">
                            <img src={linkedinIcon} alt="linkedin-icon" className="icon-img" />
                        </a>
                        <a href="https://t.me/Ventilatorrrrr" target="_blank" rel="noopener noreferrer">
                            <img src={telegramIcon} alt="telegram-icon" className="icon-img" />
                        </a>
                        <a href="https://www.instagram.com/katya.litovchenkoo/" target="_blank" rel="noopener noreferrer">
                            <img src={instagramIcon} alt="instagram-icon" className="icon-img" />
                        </a>
                    </div>
                </div>

                <div className="footer-section">
                    <h3>Contacts</h3>
                    <p>+380979876179</p>
                    <p>katya.litovchenko@gmail.com</p>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {currentYear} USOF. All rights reserved.</p>
            </div>
        </footer>
    );
}