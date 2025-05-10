"use client";

import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaSun, FaMoon } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useState, useEffect } from "react";
import {
  CircleIcon as CircleHalf,
  Twitter,
  Github,
  Sun,
  Moon,
  Star,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import nftimg from "../../public/nft.png";
import { useRouter } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import { BsCircleHalf } from "react-icons/bs"; // React icon alternative for CircleHalf
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const AnimatedStat = ({ target, duration = 2000, delay = 0 }: { target: string; duration?: number; delay?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let start = 0;
      const end = parseInt(target.replace(/\D/g, ""));
      const increment = Math.ceil(end / (duration / 16)); // ~60fps

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          clearInterval(timer);
          setCount(end);
        } else {
          setCount(start);
        }
      }, 16);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [target, duration, delay]);

  return (
    <span>
      {count.toLocaleString()}
      {target.replace(/\d+/g, "")}
    </span>
  );
};

// Testimonial component
interface TestimonialProps {
  author: string;
  role: string;
  quote: string;
  rating: number;
  darkMode: boolean;
  delay: number;
}

const Testimonial = ({ author, role, quote, rating, darkMode, delay }: TestimonialProps) => {
  return (
    <motion.div
      className={`p-6 rounded-2xl shadow-lg ${
        darkMode
          ? "bg-gray-800 border border-purple-800"
          : "bg-white border border-purple-200"
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="flex mb-2">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p
        className={`mb-4 text-lg italic ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        "{quote}"
      </p>
      <div className="flex items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            darkMode ? "bg-purple-700" : "bg-purple-600"
          } text-white font-bold`}
        >
          {author.charAt(0)}
        </div>
        <div className="ml-3">
          <h4 className="font-bold">{author}</h4>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {role}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();
  const handleClick = () => {
    router.push("/collections"); 
  };

  const [address, setAddress] = useState("");
  const handleSearch = () => {
    if (address.trim()) {
      
      window.open(`/nft/${address.trim()}`, "_blank")
   
    }
  };

  // Initialize dark mode based on user preference on component mount
  useEffect(() => {
    // Check if user previously set dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);

    // Apply the class to the document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Save preference to localStorage
    localStorage.setItem("darkMode", newDarkMode.toString());

    // Add or remove dark class from document
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-[#bba8f2] text-gray-900"
      } overflow-hidden relative transition-colors duration-300`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-30">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full border ${
              darkMode ? "border-purple-300" : "border-purple-900"
            }`}
            style={{
              width: `${(i + 1) * 20}%`,
              height: `${(i + 1) * 20}%`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}

          <header className="container mx-auto px-4 py-6 flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <BsCircleHalf size={36} className="text-purple-500" />
           <a href="/">
                <span className="text-2xl font-bold">LiquiDate</span>
            </a>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
           
          </nav>

          {/* Right Section (Visible Only on md and Up) */}
          <div className="hidden md:flex items-center gap-4 md:mr-32">
            <a
              href="https://x.com/raut_madridista"
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                darkMode
                  ? "text-purple-300 hover:text-purple-200"
                  : "text-purple-900 hover:text-purple-700"
              } transition-colors`}
            >
              <FaXTwitter size={20} />
            </a>
            <a
              href="https://github.com/shivaji43/buy-nft/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                darkMode
                  ? "text-purple-300 hover:text-purple-200"
                  : "text-purple-900 hover:text-purple-700"
              } transition-colors`}
            >
              <FaGithub size={20} />
            </a>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                darkMode
                  ? "bg-gray-800 text-yellow-300 hover:bg-gray-700"
                  : "bg-purple-200 text-purple-900 hover:bg-purple-300"
              } transition-colors`}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-purple-500"
              aria-label="Toggle menu"
            >
              {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="absolute top-10 left-60 w-full bg-transparent dark:bg-gray-900 px-4 py-6 flex flex-col gap-4 md:hidden z-50">
             

              {/* Social Icons and Dark Mode for Mobile */}
              <div className="flex items-center gap-4 mt-4">
                <a
                  href="https://x.com/raut_madridista"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    darkMode
                      ? "text-purple-300 hover:text-purple-200"
                      : "text-purple-900 hover:text-purple-700"
                  } transition-colors`}
                >
                  <FaXTwitter size={20} />
                </a>
                <a
                  href="https://github.com/shivaji43/buy-nft/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${
                    darkMode
                      ? "text-purple-300 hover:text-purple-200"
                      : "text-purple-900 hover:text-purple-700"
                  } transition-colors`}
                >
                  <FaGithub size={20} />
                </a>
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full ${
                    darkMode
                      ? "bg-gray-800 text-yellow-300 hover:bg-gray-700"
                      : "bg-purple-200 text-purple-900 hover:bg-purple-300"
                  } transition-colors`}
                  aria-label={
                    darkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <main className="container mx-auto md:pl-40 px-4 py-16 md:py-6 flex flex-col md:flex-row items-center">
          <motion.div
            className="md:w-1/2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.h1
              className="text-3xl md:text-7xl font-bold leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Discover
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                collect, & Buy
              </motion.span>{" "}
              <motion.span
                className={darkMode ? "text-purple-400" : "text-purple-800"}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                Extraordinary
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                NFTs
              </motion.span>
            </motion.h1>

            <motion.div
              className={`space-y-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              } max-w-lg`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.0 }}
            >
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                The Leading NFT Marketplace On Solana
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                Discover The Best NFT Collections.
              </motion.p>
            </motion.div>

            <motion.div
              className="space-y-4 pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.7 }}
            >
              <motion.div
                className="relative flex-grow"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Search NFT mint address..."
                  className={`w-full px-4 py-3 rounded-full border ${
                    darkMode
                      ? "bg-gray-800 border-purple-500 text-white"
                      : "border-purple-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent`}
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-700 hover:bg-purple-800 text-white p-2 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </motion.div>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  className={`${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-purple-700 hover:bg-purple-800"
                  } text-white px-10 py-3 rounded-full transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.9 }}
                  onClick={handleClick}
                >
                  Explore
                </motion.button>
                <motion.button
                  className={`${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-purple-700 hover:bg-purple-800"
                  } text-white px-10 py-3 rounded-full transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.9 }}
                  onClick={handleSearch}
                >
                  Buy
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

         
         <div className="w-full md:w-1/2 mt-12 md:mt-0 md:mb-32 px-4">
  <div className="relative">
    <div
      className={`${
        darkMode ? "bg-gray-800" : "bg-gray-900"
      } rounded-3xl p-4 w-full max-w-md mx-auto`}
    >
      {/* NFT Image Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <Image
          src={nftimg}
          alt="Featured NFT"
          width={400}
          height={400}
          className="w-full h-auto object-cover"
        />

        {/* Price Info Section */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 w-full sm:w-auto text-center sm:text-left">
            <p className="text-sm text-gray-400">Total SOL</p>
            <p className="text-gray-300">Floor Price : 1.2 SOL</p>
          </div>
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 w-full sm:w-auto text-center sm:text-right">
            <p className="text-xl font-bold text-white">12.35 SOL</p>
            <p className="text-green-500 text-sm">+23.5%</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-9 md:mt-3">
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-6 text-center">
          {/* Stat: Collections */}
          <div>
            <p
              className={`text-2xl font-bold ${
                darkMode ? "text-purple-400" : "text-purple-900"
              }`}
            >
              <AnimatedStat target="432K+" delay={0} />
            </p>
            <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
              Collections
            </p>
          </div>

          {/* Stat: Artists */}
          <div>
            <p
              className={`text-2xl font-bold ${
                darkMode ? "text-purple-400" : "text-purple-900"
              }`}
            >
              <AnimatedStat target="200K+" delay={1000} />
            </p>
            <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
              Artists
            </p>
          </div>

          {/* Stat: Community */}
          <div>
            <p
              className={`text-2xl font-bold ${
                darkMode ? "text-purple-400" : "text-purple-900"
              }`}
            >
              <AnimatedStat target="10K+" delay={2000} />
            </p>
            <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
              Community
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


        </main>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className={`py-20 ${
            darkMode ? "bg-gray-900" : "bg-purple-50"
          } transition-colors duration-300`}
        >
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-16"
            >
              <h2
                className={`text-4xl font-bold mb-4 ${
                  darkMode ? "text-purple-400" : "text-purple-800"
                }`}
              >
                What Our Community Says
              </h2>
              <p
                className={`max-w-2xl mx-auto ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Join thousands of satisfied collectors and artists who are part
                of the LiquiDate NFT revolution.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Testimonial
                author="Ethan Montgomery"
                role="NFT Collector"
                quote="LiquiDate transformed how I discover and collect digital art. The platform is intuitive and the community is incredibly supportive."
                rating={5}
                darkMode={darkMode}
                delay={0.2}
              />
              <Testimonial
                author="Olivia Zhang"
                role="Digital Artist"
                quote="As an artist, I've tried many platforms, but the exposure and tools LiquiDate provides are unmatched. My sales increased 300% in just two months!"
                rating={5}
                darkMode={darkMode}
                delay={0.4}
              />
              <Testimonial
                author="Marcus Johnson"
                role="Crypto Investor"
                quote="The analytics and market insights LiquiDate provides helped me make informed investment decisions. Their wallet tracking feature is invaluable."
                rating={4}
                darkMode={darkMode}
                delay={0.6}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mt-12"
            >
              <button
                className={`${
                  darkMode
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-purple-700 hover:bg-purple-800"
                } text-white px-8 py-3 rounded-full transition-colors inline-flex items-center`}
              >
                Read More Testimonials
                <ChevronRight size={16} className="ml-2" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section
          className={`py-16 ${
            darkMode ? "bg-gray-800" : "bg-purple-100"
          } transition-colors duration-300`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <motion.h3
                className={`text-3xl font-bold mb-4 ${
                  darkMode ? "text-purple-400" : "text-purple-800"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                Stay Updated on New Drops
              </motion.h3>
              <motion.p
                className={`mb-8 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                Subscribe to our newsletter and never miss the latest NFT drops,
                marketplace updates, and exclusive offers.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className={`px-6 py-3 rounded-full flex-grow max-w-md ${
                    darkMode
                      ? "bg-gray-700 border-purple-500 text-white"
                      : "border border-purple-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-purple-600`}
                />
                <button
                  className={`${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-purple-700 hover:bg-purple-800"
                  } text-white px-8 py-3 rounded-full transition-colors whitespace-nowrap`}
                >
                  Subscribe Now
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className={`py-16 ${
            darkMode ? "bg-gray-900 text-gray-300" : "bg-purple-900 text-white"
          } transition-colors duration-300`}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Company Info */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <CircleHalf size={36} className="text-purple-400" />
                  <span className="text-2xl font-bold">LiquiDate</span>
                </div>
                <p className="mb-6 opacity-80">
                  The premier NFT marketplace for discovering, collecting, and
                  trading extraordinary digital assets on the Solana blockchain.
                </p>
                <div className="flex space-x-4">
                  <a
                    href="https://github.com/shivaji43/buy-nft/"
                    className="text-purple-300 hover:text-purple-200 transition-colors"
                    aria-label="Twitter"
                  >
                    <FaGithub></FaGithub>
                  </a>
                  <a
                    href="https://x.com/raut_madridista"
                    className="text-purple-300 hover:text-purple-200 transition-colors"
                    aria-label="GitHub"
                  >
                    <FaXTwitter />
                  </a>
                  
                </div>
              </div>

              {/* Marketplace Links */}
              <div>
                <h4 className="text-xl font-bold mb-6">Marketplace</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="#explore"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Explore
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#featured"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Featured Collections
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#trending"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Trending NFTs
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#create"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Create NFT
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#analytics"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Analytics
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h4 className="text-xl font-bold mb-6">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="#help"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#blog"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#developers"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Developers
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#faq"
                      className="hover:text-purple-300 transition-colors"
                    >
                      FAQs
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#about"
                      className="hover:text-purple-300 transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-xl font-bold mb-6">Contact Us</h4>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Mail size={18} className="mr-3 mt-1 flex-shrink-0" />
                    <span>support@liquidate.io</span>
                  </li>
                  <li className="flex items-start">
                    <Phone size={18} className="mr-3 mt-1 flex-shrink-0" />
                    <span>+1 (888) NFT-LQDT</span>
                  </li>
                  <li className="flex items-start">
                    <MapPin size={18} className="mr-3 mt-1 flex-shrink-0" />
                    <span>
                      123 Blockchain Avenue
                      <br />
                      San Francisco, CA 94107
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-12 mt-12 border-t border-purple-700/50">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm opacity-70 mb-4 md:mb-0">
                  © {new Date().getFullYear()} LiquiDate NFT Marketplace. All
                  rights reserved.
                </p>
                <div className="flex space-x-6 text-sm">
                  <Link
                    href="#terms"
                    className="hover:text-purple-300 transition-colors"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    href="#privacy"
                    className="hover:text-purple-300 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="#cookies"
                    className="hover:text-purple-300 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
