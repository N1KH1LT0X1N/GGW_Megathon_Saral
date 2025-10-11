import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Breadcrumbs = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2 text-sm"
      aria-label="Breadcrumb"
    >
      {/* Home Link */}
      <Link
        to="/"
        className="flex items-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors duration-150 p-1 rounded"
      >
        <FiHome className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {/* Breadcrumb Items */}
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <FiChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
          
          {index === items.length - 1 ? (
            <span className="text-neutral-900 dark:text-white font-medium px-1">
              {item.label}
            </span>
            ) : (
            <Link
              to={item.href}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors duration-150 px-1 py-1 rounded"
            >
              {item.label}
            </Link>
            )}
          </React.Fragment>
          ))}
    </motion.nav>
    );
};

export default Breadcrumbs;
