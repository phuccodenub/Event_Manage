import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="text-gray-600 text-sm py-6 border-t">
      <div className="container mx-auto">
        {/* Footer Links */}
        <div className="flex flex-wrap justify-center gap-x-5">
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/accessibility" className="hover:underline">Accessibility</Link>
          <Link to="/help" className="hover:underline">Help Center</Link>
          <Link to="/privacy" className="hover:underline">Privacy & Terms</Link>
          <Link to="/ad-choices" className="hover:underline">Ad Choices</Link>
          <Link to="/advertising" className="hover:underline">Advertising</Link>
          <Link to="/business" className="hover:underline">Business Services</Link>
          <Link to="/mobile" className="hover:underline">Get the Event Hutech app</Link>
          <Link to="/more" className="hover:underline">More</Link>
        </div>

        {/* Footer Bottom */}
        <div className="mt-4 text-center text-gray-400">
          Event Hutech Corporation © 2025
        </div>
      </div>
    </footer>
  );
};

export default Footer;
