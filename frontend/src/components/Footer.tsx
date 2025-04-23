import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 text-sm py-6 border-t">
      <div className="container mx-auto">
        {/* Footer Links */}
        <div className="flex flex-wrap justify-center gap-x-5">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Accessibility</a>
          <a href="#" className="hover:underline">Help Center</a>
          <a href="#" className="hover:underline">Privacy & Terms</a>
          <a href="#" className="hover:underline">Ad Choices</a>
          <a href="#" className="hover:underline">Advertising</a>
          <a href="#" className="hover:underline">Business Services</a>
          <a href="#" className="hover:underline">Get the Event Hutech app</a>
          <a href="#" className="hover:underline">More</a>
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
